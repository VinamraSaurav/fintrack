-- Migration: 0003_subcategories_seed
-- Seed default subcategories for all default categories

-- ─── Groceries ───────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_vegetables',    'cat_groceries', 'Vegetables'),
  ('sub_fruits',        'cat_groceries', 'Fruits'),
  ('sub_dairy',         'cat_groceries', 'Dairy'),
  ('sub_staples',       'cat_groceries', 'Staples & Grains'),
  ('sub_spices',        'cat_groceries', 'Spices & Masala'),
  ('sub_dry_fruits',    'cat_groceries', 'Dry Fruits & Nuts'),
  ('sub_beverages',     'cat_groceries', 'Beverages'),
  ('sub_snacks_groc',   'cat_groceries', 'Packaged Snacks'),
  ('sub_oils',          'cat_groceries', 'Oils & Ghee'),
  ('sub_frozen',        'cat_groceries', 'Frozen Food'),
  ('sub_bakery',        'cat_groceries', 'Bakery & Bread'),
  ('sub_meat',          'cat_groceries', 'Meat & Seafood');

-- ─── Food & Dining ───────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_restaurant',    'cat_food', 'Restaurant'),
  ('sub_street_food',   'cat_food', 'Street Food'),
  ('sub_fast_food',     'cat_food', 'Fast Food'),
  ('sub_cafe',          'cat_food', 'Cafe & Coffee'),
  ('sub_delivery',      'cat_food', 'Food Delivery'),
  ('sub_sweets',        'cat_food', 'Sweets & Desserts'),
  ('sub_alcohol',       'cat_food', 'Alcohol & Drinks');

-- ─── Transport ───────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_fuel',          'cat_transport', 'Fuel'),
  ('sub_cab',           'cat_transport', 'Cab / Ride'),
  ('sub_bus',           'cat_transport', 'Bus'),
  ('sub_metro',         'cat_transport', 'Metro / Train'),
  ('sub_auto',          'cat_transport', 'Auto Rickshaw'),
  ('sub_parking',       'cat_transport', 'Parking & Toll'),
  ('sub_vehicle_maint', 'cat_transport', 'Vehicle Maintenance'),
  ('sub_flight',        'cat_transport', 'Flight');

-- ─── Utilities ───────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_electricity',   'cat_utilities', 'Electricity'),
  ('sub_water',         'cat_utilities', 'Water'),
  ('sub_gas',           'cat_utilities', 'Gas / LPG'),
  ('sub_internet',      'cat_utilities', 'Internet / WiFi'),
  ('sub_phone',         'cat_utilities', 'Phone / Recharge'),
  ('sub_rent',          'cat_utilities', 'Rent'),
  ('sub_maintenance',   'cat_utilities', 'Society Maintenance'),
  ('sub_insurance',     'cat_utilities', 'Insurance');

-- ─── Health ──────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_medicine',      'cat_health', 'Medicine'),
  ('sub_doctor',        'cat_health', 'Doctor / Consultation'),
  ('sub_lab_tests',     'cat_health', 'Lab Tests'),
  ('sub_gym',           'cat_health', 'Gym / Fitness'),
  ('sub_dental',        'cat_health', 'Dental'),
  ('sub_eye_care',      'cat_health', 'Eye Care');

-- ─── Shopping ────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_clothing',      'cat_shopping', 'Clothing'),
  ('sub_electronics',   'cat_shopping', 'Electronics'),
  ('sub_household',     'cat_shopping', 'Household Items'),
  ('sub_personal_care', 'cat_shopping', 'Personal Care'),
  ('sub_cleaning',      'cat_shopping', 'Cleaning Supplies'),
  ('sub_gifts',         'cat_shopping', 'Gifts');

-- ─── Entertainment ───────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_movies',        'cat_entertainment', 'Movies / Cinema'),
  ('sub_subscriptions', 'cat_entertainment', 'Subscriptions / OTT'),
  ('sub_gaming',        'cat_entertainment', 'Gaming'),
  ('sub_events',        'cat_entertainment', 'Events / Concerts'),
  ('sub_hobbies',       'cat_entertainment', 'Hobbies');

-- ─── Education ───────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_tuition',       'cat_education', 'Tuition / Coaching'),
  ('sub_books',         'cat_education', 'Books & Stationery'),
  ('sub_courses',       'cat_education', 'Online Courses'),
  ('sub_exam_fees',     'cat_education', 'Exam Fees');

-- ─── Other ───────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO subcategories (id, category_id, name) VALUES
  ('sub_charity',       'cat_other', 'Charity / Donation'),
  ('sub_pet',           'cat_other', 'Pet Care'),
  ('sub_travel',        'cat_other', 'Travel'),
  ('sub_legal',         'cat_other', 'Legal / Government'),
  ('sub_misc',          'cat_other', 'Miscellaneous');
