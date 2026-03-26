import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { incomes } from '@fintrack/shared/schema';
import { generateId } from '../utils/id';

export class IncomeService {
  private db;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async list(userId: string, from?: string, to?: string) {
    const conditions = [eq(incomes.userId, userId)];
    if (from) conditions.push(gte(incomes.incomeDate, from));
    if (to) conditions.push(lte(incomes.incomeDate, to));

    return this.db
      .select()
      .from(incomes)
      .where(and(...conditions))
      .orderBy(desc(incomes.incomeDate))
      .limit(100);
  }

  async create(userId: string, input: {
    title: string;
    amount: number;
    income_date: string;
    source?: string;
    is_recurring?: boolean;
    note?: string;
    currency?: string;
  }) {
    const id = generateId();
    await this.db.insert(incomes).values({
      id,
      userId,
      title: input.title,
      amount: input.amount,
      currency: input.currency ?? 'INR',
      incomeDate: input.income_date,
      source: input.source ?? null,
      isRecurring: input.is_recurring ?? false,
      note: input.note ?? null,
    });
    return { id, ...input };
  }

  async delete(userId: string, incomeId: string) {
    const [existing] = await this.db
      .select()
      .from(incomes)
      .where(and(eq(incomes.id, incomeId), eq(incomes.userId, userId)))
      .limit(1);
    if (!existing) throw new Error('Not Found');
    await this.db.delete(incomes).where(eq(incomes.id, incomeId));
  }

  async getMonthlyTotal(userId: string, month: string) {
    const [result] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${incomes.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, userId),
          gte(incomes.incomeDate, `${month}-01`),
          lte(incomes.incomeDate, `${month}-31`),
        ),
      );
    return result;
  }
}
