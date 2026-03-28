-- Migration: 0006_item_payment_mode
-- Adds payment mode per expense item for spends, exports, and analytics

ALTER TABLE expense_items ADD COLUMN payment_mode TEXT;

CREATE INDEX IF NOT EXISTS idx_items_payment_mode
  ON expense_items(payment_mode);
