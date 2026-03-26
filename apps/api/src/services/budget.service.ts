import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql } from 'drizzle-orm';
import { budgets, expenses, expenseItems, categories } from '@fintrack/shared/schema';
import { generateId } from '../utils/id';

export class BudgetService {
  private db;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async list(userId: string) {
    return this.db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        monthlyLimit: budgets.monthlyLimit,
        month: budgets.month,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, userId));
  }

  async create(userId: string, input: { category_id?: string; monthly_limit: number; month: string }) {
    const id = generateId();
    await this.db.insert(budgets).values({
      id,
      userId,
      categoryId: input.category_id ?? null,
      monthlyLimit: input.monthly_limit,
      month: input.month,
    });
    return { id, ...input };
  }

  async delete(userId: string, budgetId: string) {
    const [existing] = await this.db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)))
      .limit(1);
    if (!existing) throw new Error('Not Found');
    await this.db.delete(budgets).where(eq(budgets.id, budgetId));
  }

  async getProgress(userId: string, month: string) {
    // Get all budgets for this month (including "recurring")
    const userBudgets = await this.db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        monthlyLimit: budgets.monthlyLimit,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(
        and(
          eq(budgets.userId, userId),
          sql`(${budgets.month} = ${month} OR ${budgets.month} = 'recurring')`,
        ),
      );

    // Get actual spending per category for the month
    const monthStart = `${month}-01`;
    const monthEnd = `${month}-31`;

    const spending = await this.db
      .select({
        categoryId: expenseItems.categoryId,
        total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .where(
        and(
          eq(expenses.userId, userId),
          sql`${expenses.expenseDate} >= ${monthStart}`,
          sql`${expenses.expenseDate} <= ${monthEnd}`,
        ),
      )
      .groupBy(expenseItems.categoryId);

    const spendingMap = new Map(spending.map((s) => [s.categoryId, s.total]));
    const totalSpending = spending.reduce((sum, s) => sum + s.total, 0);

    return userBudgets.map((b) => {
      // For "Overall" budget (categoryId is null), use total spending
      const spent = b.categoryId === null ? totalSpending : (spendingMap.get(b.categoryId) ?? 0);
      return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.categoryName ?? 'Overall',
      categoryIcon: b.categoryIcon ?? '📊',
      categoryColor: b.categoryColor ?? '#6b7280',
      limit: b.monthlyLimit,
      spent,
      percentage: Math.round((spent / b.monthlyLimit) * 100),
    };
    });
  }
}
