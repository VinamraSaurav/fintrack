import { sqliteTable, text, real, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('idx_users_email').on(table.email),
]);

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  userId: text('user_id').references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_categories_user').on(table.userId),
]);

// ─── Subcategories ───────────────────────────────────────────────────────────

export const subcategories = sqliteTable('subcategories', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  name: text('name').notNull(),
  userId: text('user_id').references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_subcategories_category').on(table.categoryId),
]);

// ─── Canonical Items (normalized product names) ──────────────────────────────

export const canonicalItems = sqliteTable('canonical_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  vectorId: text('vector_id'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('idx_canonical_name').on(table.name),
]);

// ─── Aliases (user-typed variants → canonical) ──────────────────────────────

export const aliases = sqliteTable('aliases', {
  id: text('id').primaryKey(),
  rawName: text('raw_name').notNull(),
  canonicalId: text('canonical_id').notNull().references(() => canonicalItems.id),
  userId: text('user_id').references(() => users.id),
  confidence: real('confidence').notNull().default(1.0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_aliases_raw').on(table.rawName),
  index('idx_aliases_canonical').on(table.canonicalId),
]);

// ─── Expenses ────────────────────────────────────────────────────────────────

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title'),
  totalAmount: real('total_amount').notNull(),
  currency: text('currency').notNull().default('INR'),
  expenseDate: text('expense_date').notNull(), // ISO date: "2026-03-26"
  isGroup: integer('is_group', { mode: 'boolean' }).notNull().default(false),
  note: text('note'),
  idempotencyKey: text('idempotency_key'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_expenses_user_date').on(table.userId, table.expenseDate),
  index('idx_expenses_user_created').on(table.userId, table.createdAt),
  uniqueIndex('idx_expenses_idempotency').on(table.userId, table.idempotencyKey),
]);

// ─── Expense Items ───────────────────────────────────────────────────────────

export const expenseItems = sqliteTable('expense_items', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  canonicalId: text('canonical_id').references(() => canonicalItems.id),
  rawName: text('raw_name').notNull(),
  displayName: text('display_name').notNull(),
  quantity: real('quantity').notNull().default(1),
  unit: text('unit'), // kg, L, pcs, kWh, NA
  unitPrice: real('unit_price'),
  amount: real('amount').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  subcategoryId: text('subcategory_id').references(() => subcategories.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_items_expense').on(table.expenseId),
  index('idx_items_canonical').on(table.canonicalId),
  index('idx_items_category').on(table.categoryId),
]);

// ─── Expense Participants (group expenses) ───────────────────────────────────

export const expenseParticipants = sqliteTable('expense_participants', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  shareAmount: real('share_amount').notNull(),
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
}, (table) => [
  index('idx_participants_expense').on(table.expenseId),
]);

// ─── Budgets ─────────────────────────────────────────────────────────────────

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  categoryId: text('category_id').references(() => categories.id),
  monthlyLimit: real('monthly_limit').notNull(),
  month: text('month').notNull(), // "2026-03" or "recurring"
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_budgets_user_month').on(table.userId, table.month),
]);

// ─── Tags ────────────────────────────────────────────────────────────────────

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('idx_tags_user_name').on(table.userId, table.name),
]);

export const expenseTags = sqliteTable('expense_tags', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  index('idx_expense_tags_expense').on(table.expenseId),
  index('idx_expense_tags_tag').on(table.tagId),
]);

// ─── Income ──────────────────────────────────────────────────────────────────

export const incomes = sqliteTable('incomes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('INR'),
  incomeDate: text('income_date').notNull(),
  source: text('source'), // salary, freelance, investment, etc.
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
  note: text('note'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_incomes_user_date').on(table.userId, table.incomeDate),
]);

// ─── Logs (audit trail) ─────────────────────────────────────────────────────

export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  metadata: text('metadata'), // JSON blob
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_logs_user_action').on(table.userId, table.action),
  index('idx_logs_created').on(table.createdAt),
]);
