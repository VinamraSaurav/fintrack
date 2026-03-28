// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Expense Response ────────────────────────────────────────────────────────

export interface ExpenseResponse {
  id: string;
  userId: string;
  title: string | null;
  totalAmount: number;
  currency: string;
  expenseDate: string;
  isGroup: boolean;
  note: string | null;
  items: ExpenseItemResponse[];
  participants?: ParticipantResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseItemResponse {
  id: string;
  rawName: string;
  displayName: string;
  canonicalId: string | null;
  note: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  amount: number;
  paymentMode: string | null;
  categoryId: string | null;
  categoryName?: string;
  subcategoryId: string | null;
  subcategoryName?: string;
}

export interface ParticipantResponse {
  id: string;
  name: string;
  shareAmount: number;
  isPaid: boolean;
}

// ─── Category Response ───────────────────────────────────────────────────────

export interface SubcategoryResponse {
  id: string;
  categoryId: string;
  name: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  subcategories?: SubcategoryResponse[];
}

// ─── Summary Response ────────────────────────────────────────────────────────

export interface SummaryResponse {
  period: string;
  total: number;
  count: number;
  byCategory: CategoryBreakdown[];
  byPeriod: PeriodBreakdown[];
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  total: number;
  count: number;
}

export interface PeriodBreakdown {
  label: string;
  total: number;
  count: number;
}

// ─── Insight Response ────────────────────────────────────────────────────────

export interface InsightSummaryResponse {
  currentMonth: {
    total: number;
    count: number;
    topCategory: string;
  };
  previousMonth: {
    total: number;
    count: number;
    topCategory: string;
  };
  changePercent: number;
}

export interface TrendsResponse {
  months: {
    label: string;
    total: number;
    categories: CategoryBreakdown[];
  }[];
}

export interface AskInsightResponse {
  answer: string;
  suggestedQuestions?: string[];
}

// ─── Normalization ───────────────────────────────────────────────────────────

export interface NormalizationResult {
  canonicalId: string;
  displayName: string;
  confidence: number;
  source: 'alias_cache' | 'vector_auto' | 'vector_suggestion' | 'new_canonical';
  suggestions?: NormalizationSuggestion[];
}

export interface NormalizationSuggestion {
  canonicalId: string;
  name: string;
  score: number;
}

export interface NormalizationPreview {
  status: 'exact' | 'suggested' | 'new';
  canonicalId: string | null;
  displayName: string | null;
  confidence: number | null;
}
