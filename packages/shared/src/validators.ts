import { z } from 'zod';
import { UNITS, CURRENCIES, SORT_OPTIONS, SUMMARY_PERIODS } from './constants';

// ─── Expense Item Input ──────────────────────────────────────────────────────

export const createExpenseItemSchema = z.object({
  raw_name: z.string().min(1).max(200),
  quantity: z.number().positive().optional().default(1),
  unit: z.enum(UNITS).optional(),
  unit_price: z.number().nonnegative().optional(),
  amount: z.number().positive(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
});

export type CreateExpenseItemInput = z.infer<typeof createExpenseItemSchema>;

// ─── Participant Input ───────────────────────────────────────────────────────

export const createParticipantSchema = z.object({
  name: z.string().min(1).max(100),
  share_amount: z.number().positive(),
});

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;

// ─── Create Expense ──────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  title: z.string().max(200).optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  currency: z.enum(CURRENCIES).optional().default('INR'),
  note: z.string().max(1000).optional(),
  is_group: z.boolean().optional().default(false),
  idempotency_key: z.string().max(64).optional(),
  items: z.array(createExpenseItemSchema).min(1).max(100),
  participants: z.array(createParticipantSchema).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ─── Update Expense ──────────────────────────────────────────────────────────

export const updateExpenseSchema = z.object({
  title: z.string().max(200).optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  currency: z.enum(CURRENCIES).optional(),
  note: z.string().max(1000).optional(),
  items: z.array(createExpenseItemSchema).min(1).max(100).optional(),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// ─── List Expenses Query ─────────────────────────────────────────────────────

export const listExpensesSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category_id: z.string().optional(),
  product: z.string().optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.enum(SORT_OPTIONS).optional().default('date_desc'),
});

export type ListExpensesQuery = z.infer<typeof listExpensesSchema>;

// ─── Summary Query ───────────────────────────────────────────────────────────

export const summaryQuerySchema = z.object({
  period: z.enum(SUMMARY_PERIODS),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category_id: z.string().optional(),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;

// ─── Category ────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// ─── AI Insight ──────────────────────────────────────────────────────────────

export const askInsightSchema = z.object({
  question: z.string().min(1).max(500),
});

export type AskInsightInput = z.infer<typeof askInsightSchema>;
