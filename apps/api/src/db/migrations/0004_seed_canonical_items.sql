-- Migration: 0004_seed_canonical_items
-- Seeds canonical items and aliases. Uses INSERT OR IGNORE to skip existing names.
-- For aliases, references are resolved by canonical name, not by fixed ID.

-- First, insert canonical items that don't already exist (by name)
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_potato', 'Potato', 'cat_groceries', 'seed_potato' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Potato');
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_onion', 'Onion', 'cat_groceries', 'seed_onion' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Onion');
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_tomato', 'Tomato', 'cat_groceries', 'seed_tomato' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Tomato');
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_milk', 'Milk', 'cat_groceries', 'seed_milk' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Milk');
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_rice', 'Rice', 'cat_groceries', 'seed_rice' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Rice');
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_sugar', 'Sugar', 'cat_groceries', 'seed_sugar' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Sugar');
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_oil', 'Oil', 'cat_groceries', 'seed_oil' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Oil');
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_petrol', 'Petrol', 'cat_transport', 'seed_petrol' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Petrol');
INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id)
  SELECT 'seed_diesel', 'Diesel', 'cat_transport', 'seed_diesel' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = 'Diesel');

-- Now insert aliases pointing to canonical items by name lookup
-- Potato aliases
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_potato', 'potato', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Potato';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_aloo', 'aloo', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Potato';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_alu', 'alu', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Potato';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_aaloo', 'aaloo', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Potato';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_batata', 'batata', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Potato';

-- Onion aliases
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_onion', 'onion', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Onion';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_pyaz', 'pyaz', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Onion';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_pyazz', 'pyazz', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Onion';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_kanda', 'kanda', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Onion';

-- Tomato aliases
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_tomato', 'tomato', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Tomato';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_tamatar', 'tamatar', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Tomato';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_tamato', 'tamato', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Tomato';

-- Milk aliases
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_milk', 'milk', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Milk';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_doodh', 'doodh', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Milk';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_dudh', 'dudh', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Milk';

-- Rice aliases
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_rice', 'rice', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Rice';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_chawal', 'chawal', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Rice';

-- Sugar aliases
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_sugar', 'sugar', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Sugar';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_cheeni', 'cheeni', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Sugar';

-- Oil aliases
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_oil', 'oil', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Oil';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_tel', 'tel', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Oil';

-- Petrol aliases
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_petrol', 'petrol', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Petrol';
INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence)
  SELECT 'a_fuel', 'fuel', c.id, 1.0 FROM canonical_items c WHERE c.name = 'Petrol';
