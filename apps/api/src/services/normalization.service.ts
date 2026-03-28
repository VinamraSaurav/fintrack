import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { canonicalItems, aliases } from '@fintrack/shared/schema';
import { NORMALIZATION } from '@fintrack/shared/constants';
import type { NormalizationPreview, NormalizationResult } from '@fintrack/shared/types';
import { generateId } from '../utils/id';
import { titleCase } from '../utils/date';

function normalizeComparableText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeRawName(value: string) {
  return value.trim().toLowerCase();
}

function levenshteinDistance(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function isSafeAliasCandidate(rawName: string, canonicalName: string) {
  const normalizedRaw = normalizeComparableText(rawName);
  const normalizedCanonical = normalizeComparableText(canonicalName);

  if (!normalizedRaw || !normalizedCanonical) return false;
  if (normalizedRaw === normalizedCanonical) return true;

  const distance = levenshteinDistance(normalizedRaw, normalizedCanonical);
  const maxLength = Math.max(normalizedRaw.length, normalizedCanonical.length);

  if (maxLength <= 6) return distance <= 1;
  if (maxLength <= 12) return distance <= 2;

  return distance / maxLength <= 0.18;
}

export class NormalizationService {
  private db;
  private vectorizeAvailable: boolean;
  private aiAvailable: boolean;

  constructor(
    d1: D1Database,
    private vectorize: VectorizeIndex | undefined,
    private ai: Ai | undefined,
  ) {
    this.db = drizzle(d1);
    this.vectorizeAvailable = !!vectorize && typeof vectorize.query === 'function';
    this.aiAvailable = !!ai && typeof ai.run === 'function';
  }

  async preview(rawName: string): Promise<NormalizationPreview> {
    const normalized = normalizeRawName(rawName);
    if (!normalized) {
      return {
        status: 'new',
        canonicalId: null,
        displayName: null,
        confidence: null,
      };
    }

    const exactCanonicalMatch = await this.findExactCanonicalMatch(normalized);
    if (exactCanonicalMatch) {
      return {
        status: 'exact',
        canonicalId: exactCanonicalMatch.canonicalId,
        displayName: exactCanonicalMatch.displayName,
        confidence: exactCanonicalMatch.confidence,
      };
    }

    const exactAliasMatch = await this.findExactAliasMatch(normalized);
    if (exactAliasMatch) {
      return {
        status: 'suggested',
        canonicalId: exactAliasMatch.canonicalId,
        displayName: exactAliasMatch.displayName,
        confidence: exactAliasMatch.confidence,
      };
    }

    const suggestedMatch = await this.findSuggestedMatch(normalized, rawName);
    if (suggestedMatch) {
      return {
        status: 'suggested',
        canonicalId: suggestedMatch.canonicalId,
        displayName: suggestedMatch.displayName,
        confidence: suggestedMatch.confidence,
      };
    }

    return {
      status: 'new',
      canonicalId: null,
      displayName: null,
      confidence: null,
    };
  }

  /**
   * Lookup-oriented resolver. This can return a suggestion but does not persist aliases
   * unless the input was already an exact alias match.
   */
  async resolve(rawName: string): Promise<NormalizationResult> {
    const normalized = normalizeRawName(rawName);
    const exactMatch = await this.findExactMatch(normalized);
    if (exactMatch) return exactMatch;

    const suggestedMatch = await this.findSuggestedMatch(normalized, rawName);
    if (suggestedMatch) return suggestedMatch;

    return this.createNewCanonical(normalized, rawName);
  }

  /**
   * Save-time resolver. Only exact matches are auto-applied. Any fuzzy/vector match
   * must be explicitly confirmed by the client via `confirmedCanonicalId`.
   */
  async resolveForSave(rawName: string, confirmedCanonicalId?: string): Promise<NormalizationResult> {
    const normalized = normalizeRawName(rawName);

    if (confirmedCanonicalId) {
      const confirmed = await this.resolveConfirmedCanonical(rawName, confirmedCanonicalId);
      if (confirmed) return confirmed;
    }

    const exactCanonicalMatch = await this.findExactCanonicalMatch(normalized);
    if (exactCanonicalMatch) return exactCanonicalMatch;

    return this.createNewCanonical(normalized, rawName);
  }

  private async findExactMatch(normalized: string): Promise<NormalizationResult | null> {
    const aliasMatch = await this.findExactAliasMatch(normalized);
    if (aliasMatch) return aliasMatch;

    return this.findExactCanonicalMatch(normalized);
  }

  private async findExactAliasMatch(normalized: string): Promise<NormalizationResult | null> {
    if (!normalized) return null;

    const existingAlias = await this.db
      .select({
        canonicalId: aliases.canonicalId,
        name: canonicalItems.name,
      })
      .from(aliases)
      .innerJoin(canonicalItems, eq(aliases.canonicalId, canonicalItems.id))
      .where(eq(aliases.rawName, normalized))
      .limit(1);

    if (existingAlias.length > 0) {
      return {
        canonicalId: existingAlias[0].canonicalId,
        displayName: existingAlias[0].name,
        confidence: 1.0,
        source: 'alias_cache',
      };
    }

    return null;
  }

  private async findExactCanonicalMatch(normalized: string): Promise<NormalizationResult | null> {
    if (!normalized) return null;

    const exactCanonical = await this.db
      .select({
        id: canonicalItems.id,
        name: canonicalItems.name,
      })
      .from(canonicalItems)
      .where(sql`LOWER(TRIM(${canonicalItems.name})) = ${normalized}`)
      .limit(1);

    if (exactCanonical.length > 0) {
      return {
        canonicalId: exactCanonical[0].id,
        displayName: exactCanonical[0].name,
        confidence: 1.0,
        source: 'alias_cache',
      };
    }

    return null;
  }

  private async findSuggestedMatch(
    normalized: string,
    rawName: string,
  ): Promise<NormalizationResult | null> {
    if (!normalized || !this.vectorizeAvailable || !this.aiAvailable) {
      return null;
    }

    try {
      const vector = await this.getEmbedding(normalized);
      const matches = await this.vectorize!.query(vector, {
        topK: NORMALIZATION.VECTOR_TOP_K,
        returnMetadata: 'all',
      });

      if (matches.matches.length === 0) return null;

      const best = matches.matches[0];
      const [canonical] = await this.db
        .select()
        .from(canonicalItems)
        .where(eq(canonicalItems.id, best.id))
        .limit(1);

      if (
        !canonical ||
        best.score < NORMALIZATION.SUGGEST_THRESHOLD ||
        !isSafeAliasCandidate(normalized, canonical.name)
      ) {
        return null;
      }

      return {
        canonicalId: best.id,
        displayName: canonical.name,
        confidence: best.score,
        source: 'vector_suggestion',
      };
    } catch (err) {
      console.warn('Vector suggestion failed:', err);
      return null;
    }
  }

  private async resolveConfirmedCanonical(
    rawName: string,
    canonicalId: string,
  ): Promise<NormalizationResult | null> {
    const [canonical] = await this.db
      .select()
      .from(canonicalItems)
      .where(eq(canonicalItems.id, canonicalId))
      .limit(1);

    if (!canonical) {
      return null;
    }

    await this.storeAlias(rawName, canonicalId, 1.0);

    return {
      canonicalId,
      displayName: canonical.name,
      confidence: 1.0,
      source: 'alias_cache',
    };
  }

  private async storeAlias(rawName: string, canonicalId: string, confidence: number) {
    const normalized = normalizeRawName(rawName);
    if (!normalized) return;

    const [existingAlias] = await this.db
      .select({ canonicalId: aliases.canonicalId })
      .from(aliases)
      .where(eq(aliases.rawName, normalized))
      .limit(1);

    if (existingAlias?.canonicalId === canonicalId) {
      return;
    }

    if (existingAlias) {
      await this.db.delete(aliases).where(eq(aliases.rawName, normalized));
    }

    await this.db.insert(aliases).values({
      id: generateId(),
      rawName: normalized,
      canonicalId,
      confidence,
    });
  }

  private async getEmbedding(text: string) {
    const embeddingResult = await this.ai!.run(NORMALIZATION.EMBEDDING_MODEL as any, {
      text: [text],
    });

    return (embeddingResult as any).data[0] as number[];
  }

  private async createNewCanonical(
    normalized: string,
    rawName: string,
    vector?: number[],
  ): Promise<NormalizationResult> {
    const newId = generateId();
    const displayName = titleCase(rawName);
    let embedding = vector;

    if (!embedding && this.vectorizeAvailable && this.aiAvailable) {
      try {
        embedding = await this.getEmbedding(normalized);
      } catch {
        embedding = undefined;
      }
    }

    await this.db.batch([
      this.db.insert(canonicalItems).values({
        id: newId,
        name: displayName,
        vectorId: newId,
      }),
      this.db.insert(aliases).values({
        id: generateId(),
        rawName: normalized,
        canonicalId: newId,
        confidence: 1.0,
      }),
    ]);

    if (this.vectorizeAvailable && embedding) {
      try {
        await this.vectorize!.upsert([{
          id: newId,
          values: embedding,
          metadata: { name: displayName },
        }]);
      } catch {
        // Non-critical — vector upsert can fail in dev
      }
    }

    return {
      canonicalId: newId,
      displayName,
      confidence: 1.0,
      source: 'new_canonical',
    };
  }

  /**
   * Add a canonical item manually (admin/seed).
   */
  async addCanonical(name: string, categoryId?: string): Promise<string> {
    const id = generateId();
    const normalized = normalizeRawName(name);
    let embedding: number[] | undefined;

    if (this.aiAvailable && this.vectorizeAvailable) {
      try {
        embedding = await this.getEmbedding(normalized);
      } catch {
        embedding = undefined;
      }
    }

    await this.db.insert(canonicalItems).values({
      id,
      name: titleCase(name),
      categoryId: categoryId ?? null,
      vectorId: id,
    });

    await this.storeAlias(name, id, 1.0);

    if (this.vectorizeAvailable && embedding) {
      try {
        await this.vectorize!.upsert([{
          id,
          values: embedding,
          metadata: { name: titleCase(name) },
        }]);
      } catch {
        // Non-critical
      }
    }

    return id;
  }
}
