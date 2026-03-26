import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { askInsightSchema } from '@fintrack/shared/validators';
import type { AppEnv } from '../types/env';
import { InsightService } from '../services/insight.service';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gte, lte, desc, sql, like } from 'drizzle-orm';
import { expenses, expenseItems, canonicalItems, categories, subcategories } from '@fintrack/shared/schema';

const trendsQuerySchema = z.object({
  months: z.coerce.number().int().positive().max(24).optional().default(6),
});

const itemStatsSchema = z.object({
  q: z.string().min(1).max(200),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const drilldownSchema = z.object({
  level: z.enum(['category', 'subcategory', 'item']),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const insightRoutes = new Hono<AppEnv>()
  .get('/summary', async (c) => {
    const userId = c.get('userId');
    const service = new InsightService(c.env.DB);
    const summary = await service.getMonthlySummary(userId);
    return c.json({ data: summary });
  })

  .get('/trends', zValidator('query', trendsQuerySchema), async (c) => {
    const userId = c.get('userId');
    const { months } = c.req.valid('query');
    const service = new InsightService(c.env.DB);
    const trends = await service.getTrends(userId, months);
    return c.json({ data: trends });
  })

  .get('/drilldown', zValidator('query', drilldownSchema), async (c) => {
    const userId = c.get('userId');
    const { level, period, category_id, subcategory_id, from, to } = c.req.valid('query');
    const db = drizzle(c.env.DB);

    const conditions: any[] = [eq(expenses.userId, userId)];
    if (from) conditions.push(gte(expenses.expenseDate, from));
    if (to) conditions.push(lte(expenses.expenseDate, to));

    // Period grouping expression
    const periodExpr = (() => {
      switch (period) {
        case 'daily': return sql`substr(${expenses.expenseDate}, 1, 10)`;
        case 'weekly': return sql`strftime('%Y-W%W', ${expenses.expenseDate})`;
        case 'monthly': return sql`substr(${expenses.expenseDate}, 1, 7)`;
        case 'yearly': return sql`substr(${expenses.expenseDate}, 1, 4)`;
      }
    })();

    if (level === 'category') {
      // Show distribution by category + time series per category
      const distribution = await db
        .select({
          id: expenseItems.categoryId,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
          total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
          qty: sql<number>`coalesce(sum(${expenseItems.quantity}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(expenseItems)
        .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
        .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
        .where(and(...conditions))
        .groupBy(expenseItems.categoryId)
        .orderBy(desc(sql`sum(${expenseItems.amount})`));

      const timeSeries = await db
        .select({
          period: periodExpr.as('p'),
          total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
        })
        .from(expenseItems)
        .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
        .where(and(...conditions))
        .groupBy(periodExpr)
        .orderBy(periodExpr);

      return c.json({ data: { level, distribution, timeSeries } });
    }

    if (level === 'subcategory' && category_id) {
      conditions.push(eq(expenseItems.categoryId, category_id));

      const distribution = await db
        .select({
          id: expenseItems.subcategoryId,
          name: subcategories.name,
          total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
          qty: sql<number>`coalesce(sum(${expenseItems.quantity}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(expenseItems)
        .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
        .leftJoin(subcategories, eq(expenseItems.subcategoryId, subcategories.id))
        .where(and(...conditions))
        .groupBy(expenseItems.subcategoryId)
        .orderBy(desc(sql`sum(${expenseItems.amount})`));

      const timeSeries = await db
        .select({
          period: periodExpr.as('p'),
          total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
        })
        .from(expenseItems)
        .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
        .where(and(...conditions))
        .groupBy(periodExpr)
        .orderBy(periodExpr);

      return c.json({ data: { level, categoryId: category_id, distribution, timeSeries } });
    }

    if (level === 'item') {
      if (subcategory_id) conditions.push(eq(expenseItems.subcategoryId, subcategory_id));
      else if (category_id) conditions.push(eq(expenseItems.categoryId, category_id));

      const distribution = await db
        .select({
          id: expenseItems.canonicalId,
          name: sql<string>`${expenseItems.displayName}`.as('name'),
          total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
          qty: sql<number>`coalesce(sum(${expenseItems.quantity}), 0)`,
          count: sql<number>`count(*)`,
          avgPrice: sql<number>`case when sum(${expenseItems.quantity}) > 0 then sum(${expenseItems.amount}) / sum(${expenseItems.quantity}) else 0 end`,
          unit: sql<string>`${expenseItems.unit}`.as('unit'),
        })
        .from(expenseItems)
        .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
        .where(and(...conditions))
        .groupBy(expenseItems.displayName)
        .orderBy(desc(sql`sum(${expenseItems.amount})`));

      const timeSeries = await db
        .select({
          period: periodExpr.as('p'),
          total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
        })
        .from(expenseItems)
        .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
        .where(and(...conditions))
        .groupBy(periodExpr)
        .orderBy(periodExpr);

      return c.json({ data: { level, distribution, timeSeries } });
    }

    return c.json({ data: { level, distribution: [], timeSeries: [] } });
  })

  .get('/item-stats', zValidator('query', itemStatsSchema), async (c) => {
    const userId = c.get('userId');
    const { q, from, to } = c.req.valid('query');
    const db = drizzle(c.env.DB);

    const pattern = `%${q.toLowerCase()}%`;
    const conditions = [
      eq(expenses.userId, userId),
      sql`(LOWER(${expenseItems.displayName}) LIKE ${pattern} OR LOWER(${expenseItems.rawName}) LIKE ${pattern})`,
    ];
    if (from) conditions.push(gte(expenses.expenseDate, from));
    if (to) conditions.push(lte(expenses.expenseDate, to));

    // Aggregate stats for matching items
    const [stats] = await db
      .select({
        totalSpent: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
        totalQty: sql<number>`coalesce(sum(${expenseItems.quantity}), 0)`,
        count: sql<number>`count(*)`,
        avgUnitPrice: sql<number>`case when sum(${expenseItems.quantity}) > 0 then sum(${expenseItems.amount}) / sum(${expenseItems.quantity}) else 0 end`,
        minPrice: sql<number>`min(${expenseItems.amount})`,
        maxPrice: sql<number>`max(${expenseItems.amount})`,
        firstDate: sql<string>`min(${expenses.expenseDate})`,
        lastDate: sql<string>`max(${expenses.expenseDate})`,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .where(and(...conditions));

    // Monthly breakdown for the item
    const monthlyBreakdown = await db
      .select({
        month: sql<string>`substr(${expenses.expenseDate}, 1, 7)`.as('month'),
        total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
        qty: sql<number>`coalesce(sum(${expenseItems.quantity}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .where(and(...conditions))
      .groupBy(sql`substr(${expenses.expenseDate}, 1, 7)`)
      .orderBy(sql`substr(${expenses.expenseDate}, 1, 7)`);

    // Recent entries
    const recentItems = await db
      .select({
        displayName: expenseItems.displayName,
        quantity: expenseItems.quantity,
        unit: expenseItems.unit,
        amount: expenseItems.amount,
        date: expenses.expenseDate,
        categoryName: categories.name,
        subcategoryName: subcategories.name,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
      .leftJoin(subcategories, eq(expenseItems.subcategoryId, subcategories.id))
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate))
      .limit(20);

    return c.json({
      data: {
        query: q,
        stats: {
          totalSpent: stats.totalSpent,
          totalQuantity: stats.totalQty,
          purchaseCount: stats.count,
          avgUnitPrice: Math.round(stats.avgUnitPrice * 100) / 100,
          minPrice: stats.minPrice,
          maxPrice: stats.maxPrice,
          firstPurchase: stats.firstDate,
          lastPurchase: stats.lastDate,
        },
        monthlyBreakdown,
        recentItems,
      },
    });
  })

  .post('/ask', zValidator('json', askInsightSchema), async (c) => {
    const userId = c.get('userId');
    const { question } = c.req.valid('json');

    // Gather context data
    const service = new InsightService(c.env.DB);
    const [summary, trends] = await Promise.all([
      service.getMonthlySummary(userId),
      service.getTrends(userId, 3),
    ]);

    // Use Workers AI for the response
    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
      messages: [
        {
          role: 'system',
          content: `You are a personal finance assistant. Answer questions about the user's spending based on this data:

Monthly Summary: ${JSON.stringify(summary)}
Recent Trends (3 months): ${JSON.stringify(trends)}

Today's date: ${new Date().toISOString().split('T')[0]}
Currency: INR

Be concise and use actual numbers from the data. If you cannot answer from the data, say so.`,
        },
        { role: 'user', content: question },
      ],
    });

    return c.json({
      data: {
        answer: (response as any).response ?? 'Unable to generate response',
        suggestedQuestions: [
          'What is my biggest expense category this month?',
          'How does my spending compare to last month?',
          'What items do I spend the most on?',
        ],
      },
    });
  });
