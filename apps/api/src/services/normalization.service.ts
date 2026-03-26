import { drizzle } from 'drizzle-orm/d1';
import { eq, like } from 'drizzle-orm';
import { canonicalItems, aliases } from '@fintrack/shared/schema';
import { NORMALIZATION } from '@fintrack/shared/constants';
import type { NormalizationResult } from '@fintrack/shared/types';
import { generateId } from '../utils/id';
import { titleCase } from '../utils/date';

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

  /**
   * Resolve a raw user input to a canonical item name.
   *
   * Flow:
   * 1. Exact alias lookup (instant, no AI cost)
   * 2. Fuzzy DB search (fallback when Vectorize unavailable)
   * 3. Generate embedding → vector search (when Vectorize is available)
   * 4. Based on score: auto-accept / suggest / create new
   */
  async resolve(rawName: string): Promise<NormalizationResult> {
    const normalized = rawName.trim().toLowerCase();

    // ── Step 1: Exact alias lookup ──────────────────────────────────────
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

    // ── Step 2: Try vector search if available ──────────────────────────
    if (this.vectorizeAvailable && this.aiAvailable) {
      try {
        const result = await this.resolveWithVector(normalized, rawName);
        if (result) return result;
      } catch (err) {
        console.warn('Vector search failed, falling back to DB search:', err);
      }
    }

    // ── Step 3: Fuzzy DB fallback (LIKE search) ─────────────────────────
    const fuzzyMatch = await this.db
      .select({ id: canonicalItems.id, name: canonicalItems.name })
      .from(canonicalItems)
      .where(like(canonicalItems.name, `%${normalized}%`))
      .limit(1);

    if (fuzzyMatch.length > 0) {
      // Cache alias for future
      await this.db.insert(aliases).values({
        id: generateId(),
        rawName: normalized,
        canonicalId: fuzzyMatch[0].id,
        confidence: 0.7,
      });

      return {
        canonicalId: fuzzyMatch[0].id,
        displayName: fuzzyMatch[0].name,
        confidence: 0.7,
        source: 'alias_cache',
      };
    }

    // ── Step 4: No match — create new canonical item ────────────────────
    return this.createNewCanonical(normalized, rawName);
  }

  private async resolveWithVector(
    normalized: string,
    rawName: string,
  ): Promise<NormalizationResult | null> {
    const embeddingResult = await this.ai!.run(NORMALIZATION.EMBEDDING_MODEL as any, {
      text: [normalized],
    });
    const vector = (embeddingResult as any).data[0] as number[];

    const matches = await this.vectorize!.query(vector, {
      topK: NORMALIZATION.VECTOR_TOP_K,
      returnMetadata: 'all',
    });

    if (matches.matches.length > 0) {
      const best = matches.matches[0];
      const score = best.score;

      if (score >= NORMALIZATION.AUTO_ACCEPT_THRESHOLD) {
        const [canonical] = await this.db
          .select()
          .from(canonicalItems)
          .where(eq(canonicalItems.id, best.id))
          .limit(1);

        if (canonical) {
          await this.db.insert(aliases).values({
            id: generateId(),
            rawName: normalized,
            canonicalId: best.id,
            confidence: score,
          });

          return {
            canonicalId: best.id,
            displayName: canonical.name,
            confidence: score,
            source: 'vector_auto',
          };
        }
      }

      if (score >= NORMALIZATION.SUGGEST_THRESHOLD) {
        return {
          canonicalId: best.id,
          displayName: (best.metadata as any)?.name ?? best.id,
          confidence: score,
          source: 'vector_suggestion',
          suggestions: matches.matches.map((m) => ({
            canonicalId: m.id,
            name: (m.metadata as any)?.name ?? m.id,
            score: m.score,
          })),
        };
      }
    }

    // No good vector match — create new
    return this.createNewCanonical(normalized, rawName, vector);
  }

  private async createNewCanonical(
    normalized: string,
    rawName: string,
    vector?: number[],
  ): Promise<NormalizationResult> {
    const newId = generateId();
    const displayName = titleCase(rawName);

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

    // Upsert vector if available and we have an embedding
    if (this.vectorizeAvailable && vector) {
      try {
        await this.vectorize!.upsert([{
          id: newId,
          values: vector,
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
    const normalized = name.trim().toLowerCase();

    await this.db.batch([
      this.db.insert(canonicalItems).values({
        id,
        name: titleCase(name),
        categoryId: categoryId ?? null,
        vectorId: id,
      }),
      this.db.insert(aliases).values({
        id: generateId(),
        rawName: normalized,
        canonicalId: id,
        confidence: 1.0,
      }),
    ]);

    // Generate and store embedding if AI + Vectorize available
    if (this.aiAvailable && this.vectorizeAvailable) {
      try {
        const embeddingResult = await this.ai!.run(NORMALIZATION.EMBEDDING_MODEL as any, {
          text: [normalized],
        });
        const vector = (embeddingResult as any).data[0] as number[];

        await this.vectorize!.upsert([{
          id,
          values: vector,
          metadata: { name: titleCase(name) },
        }]);
      } catch {
        // Non-critical
      }
    }

    return id;
  }
}
