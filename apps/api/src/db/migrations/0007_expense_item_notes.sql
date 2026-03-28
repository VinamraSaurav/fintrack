-- Migration: 0007_expense_item_notes
-- Adds optional notes for individual expense items

ALTER TABLE expense_items ADD COLUMN note TEXT;
