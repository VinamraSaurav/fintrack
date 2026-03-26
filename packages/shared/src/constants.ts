// ─── Units ────────────────────────────────────────────────────────────────────

export const UNITS = [
  // Weight
  'kg', 'g', 'lb', 'oz',
  // Volume
  'L', 'ml', 'cup', 'tbsp', 'tsp',
  // Count
  'pcs', 'dozen', 'pair', 'set', 'pack', 'box', 'bag', 'bundle',
  // Length / Area
  'meter', 'cm', 'ft', 'sq.ft',
  // Food serving
  'plate', 'serving', 'slice', 'bowl',
  // Containers
  'bottle', 'can', 'jar', 'tube', 'roll', 'sheet', 'bar',
  // Energy / Misc
  'kWh', 'trip', 'month', 'NA',
] as const;
export type Unit = (typeof UNITS)[number];

// ─── Currencies ──────────────────────────────────────────────────────────────

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

// ─── Sort Options ────────────────────────────────────────────────────────────

export const SORT_OPTIONS = ['date_asc', 'date_desc', 'amount_asc', 'amount_desc'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

// ─── Summary Periods ─────────────────────────────────────────────────────────

export const SUMMARY_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type SummaryPeriod = (typeof SUMMARY_PERIODS)[number];

// ─── Default Categories ──────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES = [
  { id: 'cat_groceries', name: 'Groceries', icon: '🛒', color: '#22c55e' },
  { id: 'cat_food', name: 'Food & Dining', icon: '🍕', color: '#f97316' },
  { id: 'cat_transport', name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { id: 'cat_utilities', name: 'Utilities', icon: '💡', color: '#a855f7' },
  { id: 'cat_health', name: 'Health', icon: '🏥', color: '#ef4444' },
  { id: 'cat_shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: '🎬', color: '#f59e0b' },
  { id: 'cat_education', name: 'Education', icon: '📚', color: '#6366f1' },
  { id: 'cat_other', name: 'Other', icon: '📦', color: '#6b7280' },
] as const;

// ─── Normalization Thresholds ────────────────────────────────────────────────

export const NORMALIZATION = {
  AUTO_ACCEPT_THRESHOLD: 0.85,
  SUGGEST_THRESHOLD: 0.60,
  VECTOR_TOP_K: 3,
  EMBEDDING_MODEL: '@cf/baai/bge-base-en-v1.5',
  EMBEDDING_DIMENSIONS: 768,
} as const;

// ─── Pagination ──────────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
