-- Migration: 0002_budgets_tags_income
-- Adds budgets, tags, expense_tags, and incomes tables

-- ─── Budgets ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  category_id     TEXT REFERENCES categories(id),
  monthly_limit   REAL NOT NULL,
  month           TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- ─── Tags ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  name            TEXT NOT NULL,
  color           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name);

-- ─── Expense Tags (many-to-many) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_tags (
  id              TEXT PRIMARY KEY,
  expense_id      TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  tag_id          TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense ON expense_tags(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_tag ON expense_tags(tag_id);

-- ─── Income ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incomes (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  amount          REAL NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'INR',
  income_date     TEXT NOT NULL,
  source          TEXT,
  is_recurring    INTEGER NOT NULL DEFAULT 0,
  note            TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes(user_id, income_date);
