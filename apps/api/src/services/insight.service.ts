import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { expenses, expenseItems, categories } from '@fintrack/shared/schema';
import type { InsightSummaryResponse, TrendsResponse } from '@fintrack/shared/types';
import { monthsAgo, startOfMonth, endOfMonth, todayISO } from '../utils/date';

export class InsightService {
  private db;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async getMonthlySummary(userId: string): Promise<InsightSummaryResponse> {
    const today = todayISO();
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);
    const lastMonthDate = monthsAgo(1);
    const lastMonthStart = startOfMonth(lastMonthDate);
    const lastMonthEnd = endOfMonth(lastMonthDate);

    const [current] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${expenses.totalAmount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, thisMonthStart),
          lte(expenses.expenseDate, thisMonthEnd),
        ),
      );

    const [previous] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${expenses.totalAmount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, lastMonthStart),
          lte(expenses.expenseDate, lastMonthEnd),
        ),
      );

    // Top category this month
    const [topCatCurrent] = await this.db
      .select({
        name: categories.name,
        total: sql<number>`sum(${expenseItems.amount})`,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, thisMonthStart),
          lte(expenses.expenseDate, thisMonthEnd),
        ),
      )
      .groupBy(expenseItems.categoryId)
      .orderBy(desc(sql`sum(${expenseItems.amount})`))
      .limit(1);

    const [topCatPrevious] = await this.db
      .select({
        name: categories.name,
        total: sql<number>`sum(${expenseItems.amount})`,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, lastMonthStart),
          lte(expenses.expenseDate, lastMonthEnd),
        ),
      )
      .groupBy(expenseItems.categoryId)
      .orderBy(desc(sql`sum(${expenseItems.amount})`))
      .limit(1);

    const changePercent =
      previous.total > 0
        ? ((current.total - previous.total) / previous.total) * 100
        : current.total > 0
          ? 100
          : 0;

    return {
      currentMonth: {
        total: current.total,
        count: current.count,
        topCategory: topCatCurrent?.name ?? 'None',
      },
      previousMonth: {
        total: previous.total,
        count: previous.count,
        topCategory: topCatPrevious?.name ?? 'None',
      },
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  async getTrends(userId: string, months = 6): Promise<TrendsResponse> {
    const from = monthsAgo(months);
    const today = todayISO();

    const rows = await this.db
      .select({
        month: sql<string>`substr(${expenses.expenseDate}, 1, 7)`.as('month'),
        categoryId: expenseItems.categoryId,
        categoryName: categories.name,
        total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, from),
          lte(expenses.expenseDate, today),
        ),
      )
      .groupBy(sql`substr(${expenses.expenseDate}, 1, 7)`, expenseItems.categoryId)
      .orderBy(sql`substr(${expenses.expenseDate}, 1, 7)`);

    // Group by month
    const monthMap = new Map<
      string,
      { label: string; total: number; categories: { categoryId: string; name: string; total: number; count: number }[] }
    >();

    for (const row of rows) {
      const key = row.month;
      if (!monthMap.has(key)) {
        monthMap.set(key, { label: key, total: 0, categories: [] });
      }
      const entry = monthMap.get(key)!;
      entry.total += row.total;
      entry.categories.push({
        categoryId: row.categoryId ?? 'uncategorized',
        name: row.categoryName ?? 'Uncategorized',
        total: row.total,
        count: row.count,
      });
    }

    return {
      months: Array.from(monthMap.values()),
    };
  }
}
