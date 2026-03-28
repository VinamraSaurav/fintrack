import { z } from 'zod';
import { UNITS, CURRENCIES, PAYMENT_MODES, SORT_OPTIONS, SUMMARY_PERIODS } from './constants';

// ─── Expense Item Input ──────────────────────────────────────────────────────

const optionalUnitSchema = z.preprocess(
  (value) => (value === '' || value === 'NA' || value == null ? undefined : value),
  z.enum(UNITS).optional(),
);

const optionalIdSchema = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.string().optional(),
);

const optionalItemNoteSchema = z.preprocess(
  (value) => {
    if (value == null) return undefined;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().max(280, 'Note too long').optional(),
);

const itemQuantitySchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return 1;
    if (value === '' || Number.isNaN(value)) return undefined;
    return value;
  },
  z
    .number({
      required_error: 'Enter qty',
      invalid_type_error: 'Invalid qty',
    })
    .positive('Qty > 0'),
);

const itemAmountSchema = z.preprocess(
  (value) => {
    if (value === '' || value == null || Number.isNaN(value)) return undefined;
    return value;
  },
  z
    .number({
      required_error: 'Enter amount',
      invalid_type_error: 'Invalid amount',
    })
    .positive('Amount > 0'),
);

export const createExpenseItemSchema = z.object({
  raw_name: z
    .string()
    .trim()
    .min(1, 'Enter item')
    .max(200, 'Item too long'),
  canonical_id: optionalIdSchema,
  note: optionalItemNoteSchema,
  quantity: itemQuantitySchema,
  unit: optionalUnitSchema,
  unit_price: z.number().nonnegative().optional(),
  amount: itemAmountSchema,
  payment_mode: z.enum(PAYMENT_MODES, { required_error: 'Pick payment' }),
  category_id: optionalIdSchema,
  subcategory_id: optionalIdSchema,
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
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  currency: z.enum(CURRENCIES).optional(),
  note: z.string().max(1000).optional(),
  items: z.array(createExpenseItemSchema).min(1).max(100).optional(),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// ─── List Expenses Query ─────────────────────────────────────────────────────

export const listExpensesSchema = z.object({
  q: z.preprocess(
    (value) => {
      if (value == null) return undefined;
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    },
    z.string().min(1).optional(),
  ),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  category_id: z.string().optional(),
  product: z.string().optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
  payment_mode: z.enum(PAYMENT_MODES).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.enum(SORT_OPTIONS).optional().default('date_desc'),
});

export type ListExpensesQuery = z.infer<typeof listExpensesSchema>;

// ─── Summary Query ───────────────────────────────────────────────────────────

export const summaryQuerySchema = z.object({
  period: z.enum(SUMMARY_PERIODS),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  category_id: z.string().optional(),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;

// ─── Category ────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// ─── AI Insight ──────────────────────────────────────────────────────────────

export const askInsightSchema = z.object({
  question: z.string().min(1).max(500),
});

export type AskInsightInput = z.infer<typeof askInsightSchema>;
