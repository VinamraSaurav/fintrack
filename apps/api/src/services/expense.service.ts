import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { expenses, expenseItems, expenseParticipants, categories, subcategories } from '@fintrack/shared/schema';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
} from '@fintrack/shared/validators';
import type { ExpenseResponse, ExpenseItemResponse, PaginatedResponse } from '@fintrack/shared/types';
import { generateId } from '../utils/id';
import { NormalizationService } from './normalization.service';

export class ExpenseService {
  private db;

  constructor(
    d1: D1Database,
    private normalization: NormalizationService,
  ) {
    this.db = drizzle(d1);
  }

  async create(userId: string, input: CreateExpenseInput): Promise<ExpenseResponse> {
    // Idempotency check
    if (input.idempotency_key) {
      const [existing] = await this.db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.userId, userId),
            eq(expenses.idempotencyKey, input.idempotency_key),
          ),
        )
        .limit(1);

      if (existing) {
        return this.getById(userId, existing.id);
      }
    }

    const expenseId = generateId();

    // Normalize each item and compute total
    const resolvedItems: {
      id: string;
      rawName: string;
      displayName: string;
      canonicalId: string | null;
      quantity: number;
      unit: string | null;
      unitPrice: number | null;
      amount: number;
      categoryId: string | null;
      subcategoryId: string | null;
    }[] = [];

    let totalAmount = 0;

    for (const item of input.items) {
      const resolution = await this.normalization.resolve(item.raw_name);
      const itemId = generateId();
      totalAmount += item.amount;

      resolvedItems.push({
        id: itemId,
        rawName: item.raw_name,
        displayName: resolution.displayName,
        canonicalId: resolution.canonicalId,
        quantity: item.quantity ?? 1,
        unit: item.unit ?? null,
        unitPrice: item.unit_price ?? null,
        amount: item.amount,
        categoryId: item.category_id ?? null,
        subcategoryId: item.subcategory_id ?? null,
      });
    }

    // Batch insert: expense + all items
    const statements: any[] = [
      this.db.insert(expenses).values({
        id: expenseId,
        userId,
        title: input.title ?? null,
        totalAmount,
        currency: input.currency ?? 'INR',
        expenseDate: input.expense_date,
        isGroup: input.is_group ?? false,
        note: input.note ?? null,
        idempotencyKey: input.idempotency_key ?? null,
      }),
      ...resolvedItems.map((item) =>
        this.db.insert(expenseItems).values({
          id: item.id,
          expenseId,
          canonicalId: item.canonicalId,
          rawName: item.rawName,
          displayName: item.displayName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          amount: item.amount,
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId,
        }),
      ),
    ];

    // Add participants if group expense
    if (input.is_group && input.participants?.length) {
      for (const p of input.participants) {
        statements.push(
          this.db.insert(expenseParticipants).values({
            id: generateId(),
            expenseId,
            name: p.name,
            shareAmount: p.share_amount,
            isPaid: false,
          }),
        );
      }
    }

    await this.db.batch(statements as [any, ...any[]]);

    return this.getById(userId, expenseId);
  }

  async getById(userId: string, expenseId: string): Promise<ExpenseResponse> {
    const [expense] = await this.db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
      .limit(1);

    if (!expense) throw new Error('Not Found');

    const items = await this.db
      .select({
        id: expenseItems.id,
        rawName: expenseItems.rawName,
        displayName: expenseItems.displayName,
        canonicalId: expenseItems.canonicalId,
        quantity: expenseItems.quantity,
        unit: expenseItems.unit,
        unitPrice: expenseItems.unitPrice,
        amount: expenseItems.amount,
        categoryId: expenseItems.categoryId,
        subcategoryId: expenseItems.subcategoryId,
        categoryName: categories.name,
        subcategoryName: subcategories.name,
      })
      .from(expenseItems)
      .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
      .leftJoin(subcategories, eq(expenseItems.subcategoryId, subcategories.id))
      .where(eq(expenseItems.expenseId, expenseId));

    const participants = expense.isGroup
      ? await this.db
          .select()
          .from(expenseParticipants)
          .where(eq(expenseParticipants.expenseId, expenseId))
      : undefined;

    return {
      id: expense.id,
      userId: expense.userId,
      title: expense.title,
      totalAmount: expense.totalAmount,
      currency: expense.currency,
      expenseDate: expense.expenseDate,
      isGroup: expense.isGroup,
      note: expense.note,
      items: items.map((i) => ({
        id: i.id,
        rawName: i.rawName,
        displayName: i.displayName,
        canonicalId: i.canonicalId,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        amount: i.amount,
        categoryId: i.categoryId,
        categoryName: i.categoryName ?? undefined,
        subcategoryId: i.subcategoryId,
        subcategoryName: i.subcategoryName ?? undefined,
      })),
      participants: participants?.map((p) => ({
        id: p.id,
        name: p.name,
        shareAmount: p.shareAmount,
        isPaid: p.isPaid,
      })),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  async list(userId: string, query: ListExpensesQuery): Promise<PaginatedResponse<ExpenseResponse>> {
    const conditions = [eq(expenses.userId, userId)];

    if (query.from) conditions.push(gte(expenses.expenseDate, query.from));
    if (query.to) conditions.push(lte(expenses.expenseDate, query.to));
    if (query.min_amount) conditions.push(gte(expenses.totalAmount, query.min_amount));
    if (query.max_amount) conditions.push(lte(expenses.totalAmount, query.max_amount));

    const where = and(...conditions);

    // Count total
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(where);

    // Sort
    const orderBy = (() => {
      switch (query.sort) {
        case 'date_asc': return asc(expenses.expenseDate);
        case 'date_desc': return desc(expenses.expenseDate);
        case 'amount_asc': return asc(expenses.totalAmount);
        case 'amount_desc': return desc(expenses.totalAmount);
        default: return desc(expenses.expenseDate);
      }
    })();

    const offset = (query.page - 1) * query.limit;

    const expenseRows = await this.db
      .select()
      .from(expenses)
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(offset);

    // Fetch items for all expenses in one query
    const expenseIds = expenseRows.map((e) => e.id);
    const allItems = expenseIds.length
      ? await this.db
          .select({
            id: expenseItems.id,
            expenseId: expenseItems.expenseId,
            rawName: expenseItems.rawName,
            displayName: expenseItems.displayName,
            canonicalId: expenseItems.canonicalId,
            quantity: expenseItems.quantity,
            unit: expenseItems.unit,
            unitPrice: expenseItems.unitPrice,
            amount: expenseItems.amount,
            categoryId: expenseItems.categoryId,
            subcategoryId: expenseItems.subcategoryId,
            categoryName: categories.name,
            subcategoryName: subcategories.name,
          })
          .from(expenseItems)
          .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
          .leftJoin(subcategories, eq(expenseItems.subcategoryId, subcategories.id))
          .where(inArray(expenseItems.expenseId, expenseIds))
      : [];

    const itemsByExpense = new Map<string, ExpenseItemResponse[]>();
    for (const item of allItems) {
      const list = itemsByExpense.get(item.expenseId) ?? [];
      list.push({
        id: item.id,
        rawName: item.rawName,
        displayName: item.displayName,
        canonicalId: item.canonicalId,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        amount: item.amount,
        categoryId: item.categoryId,
        categoryName: item.categoryName ?? undefined,
        subcategoryId: item.subcategoryId,
        subcategoryName: item.subcategoryName ?? undefined,
      });
      itemsByExpense.set(item.expenseId, list);
    }

    const data: ExpenseResponse[] = expenseRows.map((e) => ({
      id: e.id,
      userId: e.userId,
      title: e.title,
      totalAmount: e.totalAmount,
      currency: e.currency,
      expenseDate: e.expenseDate,
      isGroup: e.isGroup,
      note: e.note,
      items: itemsByExpense.get(e.id) ?? [],
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    };
  }

  async update(userId: string, expenseId: string, input: UpdateExpenseInput): Promise<ExpenseResponse> {
    const [existing] = await this.db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
      .limit(1);

    if (!existing) throw new Error('Not Found');

    const statements: any[] = [];

    // Update expense fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.title !== undefined) updates.title = input.title;
    if (input.expense_date) updates.expenseDate = input.expense_date;
    if (input.currency) updates.currency = input.currency;
    if (input.note !== undefined) updates.note = input.note;

    // If items provided, replace them
    if (input.items?.length) {
      // Delete old items
      statements.push(
        this.db.delete(expenseItems).where(eq(expenseItems.expenseId, expenseId)),
      );

      let totalAmount = 0;
      for (const item of input.items) {
        const resolution = await this.normalization.resolve(item.raw_name);
        totalAmount += item.amount;

        statements.push(
          this.db.insert(expenseItems).values({
            id: generateId(),
            expenseId,
            canonicalId: resolution.canonicalId,
            rawName: item.raw_name,
            displayName: resolution.displayName,
            quantity: item.quantity ?? 1,
            unit: item.unit ?? null,
            unitPrice: item.unit_price ?? null,
            amount: item.amount,
            categoryId: item.category_id ?? null,
            subcategoryId: item.subcategory_id ?? null,
          }),
        );
      }
      updates.totalAmount = totalAmount;
    }

    statements.unshift(
      this.db.update(expenses).set(updates).where(eq(expenses.id, expenseId)),
    );

    await this.db.batch(statements as [any, ...any[]]);

    return this.getById(userId, expenseId);
  }

  async delete(userId: string, expenseId: string): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
      .limit(1);

    if (!existing) throw new Error('Not Found');

    await this.db.delete(expenses).where(eq(expenses.id, expenseId));
  }

  async getSummary(userId: string, period: string, from?: string, to?: string, categoryId?: string) {
    const conditions = [eq(expenses.userId, userId)];
    if (from) conditions.push(gte(expenses.expenseDate, from));
    if (to) conditions.push(lte(expenses.expenseDate, to));

    const where = and(...conditions);

    // Total
    const [totals] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${expenses.totalAmount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(where);

    // By category
    const byCategoryRows = await this.db
      .select({
        categoryId: expenseItems.categoryId,
        categoryName: categories.name,
        total: sql<number>`coalesce(sum(${expenseItems.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(expenseItems)
      .innerJoin(expenses, eq(expenseItems.expenseId, expenses.id))
      .leftJoin(categories, eq(expenseItems.categoryId, categories.id))
      .where(where)
      .groupBy(expenseItems.categoryId);

    // By period
    const groupExpr = (() => {
      switch (period) {
        case 'daily': return sql`substr(${expenses.expenseDate}, 1, 10)`;
        case 'weekly': return sql`strftime('%Y-W%W', ${expenses.expenseDate})`;
        case 'monthly': return sql`substr(${expenses.expenseDate}, 1, 7)`;
        case 'yearly': return sql`substr(${expenses.expenseDate}, 1, 4)`;
        default: return sql`substr(${expenses.expenseDate}, 1, 7)`;
      }
    })();

    const byPeriodRows = await this.db
      .select({
        label: groupExpr.as('period_label'),
        total: sql<number>`coalesce(sum(${expenses.totalAmount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(where)
      .groupBy(groupExpr)
      .orderBy(groupExpr);

    return {
      period,
      total: totals.total,
      count: totals.count,
      byCategory: byCategoryRows.map((r) => ({
        categoryId: r.categoryId ?? 'uncategorized',
        name: r.categoryName ?? 'Uncategorized',
        total: r.total,
        count: r.count,
      })),
      byPeriod: byPeriodRows.map((r) => ({
        label: r.label as string,
        total: r.total,
        count: r.count,
      })),
    };
  }
}
