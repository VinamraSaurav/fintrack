-- Migration: 0001_initial
-- Creates all core tables for FinTrack

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  name          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── Categories ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  icon          TEXT,
  color         TEXT,
  is_default    INTEGER NOT NULL DEFAULT 0,
  user_id       TEXT REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- ─── Subcategories ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subcategories (
  id            TEXT PRIMARY KEY,
  category_id   TEXT NOT NULL REFERENCES categories(id),
  name          TEXT NOT NULL,
  user_id       TEXT REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);

-- ─── Canonical Items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS canonical_items (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category_id   TEXT REFERENCES categories(id),
  vector_id     TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_canonical_name ON canonical_items(name);

-- ─── Aliases ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aliases (
  id            TEXT PRIMARY KEY,
  raw_name      TEXT NOT NULL,
  canonical_id  TEXT NOT NULL REFERENCES canonical_items(id),
  user_id       TEXT REFERENCES users(id),
  confidence    REAL NOT NULL DEFAULT 1.0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_aliases_raw ON aliases(raw_name);
CREATE INDEX IF NOT EXISTS idx_aliases_canonical ON aliases(canonical_id);

-- ─── Expenses ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  title           TEXT,
  total_amount    REAL NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'INR',
  expense_date    TEXT NOT NULL,
  is_group        INTEGER NOT NULL DEFAULT 0,
  note            TEXT,
  idempotency_key TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON expenses(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_idempotency ON expenses(user_id, idempotency_key);

-- ─── Expense Items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_items (
  id              TEXT PRIMARY KEY,
  expense_id      TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  canonical_id    TEXT REFERENCES canonical_items(id),
  raw_name        TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  quantity        REAL NOT NULL DEFAULT 1,
  unit            TEXT,
  unit_price      REAL,
  amount          REAL NOT NULL,
  category_id     TEXT REFERENCES categories(id),
  subcategory_id  TEXT REFERENCES subcategories(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_items_expense ON expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_items_canonical ON expense_items(canonical_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON expense_items(category_id);

-- ─── Expense Participants ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_participants (
  id            TEXT PRIMARY KEY,
  expense_id    TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  share_amount  REAL NOT NULL,
  is_paid       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_participants_expense ON expense_participants(expense_id);

-- ─── Logs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
  id            TEXT PRIMARY KEY,
  user_id       TEXT REFERENCES users(id),
  action        TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     TEXT,
  metadata      TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_logs_user_action ON logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at DESC);

-- ─── Seed Default Categories ─────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (id, name, icon, color, is_default) VALUES
  ('cat_groceries',    'Groceries',      '🛒', '#22c55e', 1),
  ('cat_food',         'Food & Dining',  '🍕', '#f97316', 1),
  ('cat_transport',    'Transport',      '🚗', '#3b82f6', 1),
  ('cat_utilities',    'Utilities',      '💡', '#a855f7', 1),
  ('cat_health',       'Health',         '🏥', '#ef4444', 1),
  ('cat_shopping',     'Shopping',       '🛍️', '#ec4899', 1),
  ('cat_entertainment','Entertainment',  '🎬', '#f59e0b', 1),
  ('cat_education',    'Education',      '📚', '#6366f1', 1),
  ('cat_other',        'Other',          '📦', '#6b7280', 1);
