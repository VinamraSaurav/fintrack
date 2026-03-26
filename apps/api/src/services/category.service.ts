import { drizzle } from 'drizzle-orm/d1';
import { eq, or, and, sql } from 'drizzle-orm';
import { categories, subcategories, expenseItems } from '@fintrack/shared/schema';
import type { CreateCategoryInput } from '@fintrack/shared/validators';
import { generateId } from '../utils/id';

export class CategoryService {
  private db;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async list(userId: string) {
    const cats = await this.db
      .select()
      .from(categories)
      .where(or(eq(categories.isDefault, true), eq(categories.userId, userId)));

    const subs = await this.db
      .select()
      .from(subcategories)
      .where(
        or(
          eq(subcategories.userId, userId),
          sql`${subcategories.userId} IS NULL`,
        ),
      );

    return cats.map((cat) => ({
      ...cat,
      subcategories: subs.filter((s) => s.categoryId === cat.id),
    }));
  }

  async create(userId: string, input: CreateCategoryInput) {
    const id = generateId();
    await this.db.insert(categories).values({
      id,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      isDefault: false,
      userId,
    });
    return { id, ...input, isDefault: false };
  }

  async update(userId: string, categoryId: string, input: Partial<CreateCategoryInput>) {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));

    if (!existing) throw new Error('Not Found');
    if (existing.isDefault) throw new Error('Cannot modify default categories');
    if (existing.userId !== userId) throw new Error('Not Found');

    await this.db
      .update(categories)
      .set({
        ...(input.name && { name: input.name }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.color !== undefined && { color: input.color }),
      })
      .where(eq(categories.id, categoryId));

    return { id: categoryId, ...input };
  }

  async delete(userId: string, categoryId: string, force = false) {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));

    if (!existing) throw new Error('Not Found');
    if (existing.isDefault) throw new Error('Cannot delete default categories');
    if (existing.userId !== userId) throw new Error('Not Found');

    // Check if any expenses use this category
    const [usage] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(expenseItems)
      .where(eq(expenseItems.categoryId, categoryId));

    if (usage.count > 0 && !force) {
      throw new Error(`LINKED:${usage.count} expense items use this category. They will become uncategorized.`);
    }

    // Nullify references in expense_items
    if (usage.count > 0) {
      await this.db.update(expenseItems)
        .set({ categoryId: null, subcategoryId: null })
        .where(eq(expenseItems.categoryId, categoryId));
    }

    // Delete subcategories first, then category
    await this.db.delete(subcategories).where(eq(subcategories.categoryId, categoryId));
    await this.db.delete(categories).where(eq(categories.id, categoryId));
  }

  // ─── Subcategories ──────────────────────────────────────────────────────────

  async listSubcategories(categoryId: string) {
    return this.db
      .select()
      .from(subcategories)
      .where(eq(subcategories.categoryId, categoryId));
  }

  async createSubcategory(userId: string, categoryId: string, name: string) {
    const id = generateId();
    await this.db.insert(subcategories).values({
      id,
      categoryId,
      name,
      userId,
    });
    return { id, categoryId, name };
  }

  async updateSubcategory(userId: string, subId: string, name: string) {
    const [existing] = await this.db
      .select()
      .from(subcategories)
      .where(eq(subcategories.id, subId));

    if (!existing) throw new Error('Not Found');
    // Allow editing default subcategories if user owns the parent or it's a default
    if (existing.userId && existing.userId !== userId) throw new Error('Not Found');

    await this.db
      .update(subcategories)
      .set({ name })
      .where(eq(subcategories.id, subId));
  }

  async deleteSubcategory(userId: string, subId: string, force = false) {
    const [existing] = await this.db
      .select()
      .from(subcategories)
      .where(eq(subcategories.id, subId));

    if (!existing) throw new Error('Not Found');

    // Check if any expense items use this subcategory
    const [usage] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(expenseItems)
      .where(eq(expenseItems.subcategoryId, subId));

    if (usage.count > 0 && !force) {
      throw new Error(`LINKED:${usage.count} expense items use this subcategory. They will lose their subcategory assignment.`);
    }

    // Nullify references
    if (usage.count > 0) {
      await this.db.update(expenseItems)
        .set({ subcategoryId: null })
        .where(eq(expenseItems.subcategoryId, subId));
    }

    await this.db.delete(subcategories).where(eq(subcategories.id, subId));
  }
}
