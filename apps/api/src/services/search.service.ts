import { drizzle } from 'drizzle-orm/d1';
import { eq, and, like, sql } from 'drizzle-orm';
import { expenses, expenseItems, canonicalItems, aliases, categories } from '@fintrack/shared/schema';
import { NormalizationService } from './normalization.service';

export class SearchService {
  private db;

  constructor(
    d1: D1Database,
    private normalization: NormalizationService,
  ) {
    this.db = drizzle(d1);
  }

  /**
   * Full-text search across expense titles and item display names.
   */
  async searchExpenses(userId: string, query: string, limit = 20) {
    const pattern = `%${query}%`;

    const results = await this.db
      .select({
        id: expenses.id,
        title: expenses.title,
        totalAmount: expenses.totalAmount,
        expenseDate: expenses.expenseDate,
        currency: expenses.currency,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          sql`(${expenses.title} LIKE ${pattern} OR ${expenses.id} IN (
            SELECT DISTINCT ${expenseItems.expenseId}
            FROM ${expenseItems}
            WHERE ${expenseItems.displayName} LIKE ${pattern}
          ))`,
        ),
      )
      .limit(limit);

    return results;
  }

  /**
   * Search by product name — resolves to canonical, then finds all matching items.
   */
  async searchByProduct(userId: string, productName: string) {
    const resolution = await this.normalization.resolve(productName);

    const items = await this.db
      .select({
        id: expenseItems.id,
        expenseId: expenseItems.expenseId,
        displayName: expenseItems.displayName,
        amount: expenseItems.amount,
        quantity: expenseItems.quantity,
        unit: expenseItems.unit,
        expenseDate: expenses.expenseDate,
        categoryName: categories.name,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenseItems.canonicalId, resolution.canonicalId),
        ),
      )
      .orderBy(sql`${expenses.expenseDate} DESC`)
      .limit(50);

    return {
      canonicalName: resolution.displayName,
      canonicalId: resolution.canonicalId,
      items,
    };
  }

  /**
   * Suggest canonical items for autocomplete (prefix match + vector).
   */
  async suggest(query: string, limit = 5) {
    const pattern = `${query}%`;

    // First try prefix match in canonical items
    const prefixMatches = await this.db
      .select({ id: canonicalItems.id, name: canonicalItems.name })
      .from(canonicalItems)
      .where(like(canonicalItems.name, pattern))
      .limit(limit);

    if (prefixMatches.length >= limit) {
      return prefixMatches;
    }

    // Also check aliases
    const aliasMatches = await this.db
      .select({
        id: canonicalItems.id,
        name: canonicalItems.name,
      })
      .from(aliases)
      .innerJoin(canonicalItems, eq(aliases.canonicalId, canonicalItems.id))
      .where(like(aliases.rawName, `%${query.toLowerCase()}%`))
      .limit(limit - prefixMatches.length);

    // Deduplicate
    const seen = new Set(prefixMatches.map((m) => m.id));
    const combined = [...prefixMatches];
    for (const match of aliasMatches) {
      if (!seen.has(match.id)) {
        combined.push(match);
        seen.add(match.id);
      }
    }

    return combined;
  }
}
