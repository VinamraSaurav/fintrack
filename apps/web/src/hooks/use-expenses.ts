'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import type {
  ExpenseResponse,
  PaginatedResponse,
  InsightSummaryResponse,
  TrendsResponse,
  CategoryResponse,
  SummaryResponse,
  UpdateExpenseInput,
} from '@fintrack/shared';

function useAuthFetch() {
  const { getToken } = useAuth();
  return async <T>(path: string, options?: RequestInit) => {
    const token = await getToken();
    return apiClient<T>(path, { ...options, token: token ?? undefined });
  };
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function useExpenses(params?: Record<string, string>) {
  const fetchWithAuth = useAuthFetch();
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () =>
      fetchWithAuth<PaginatedResponse<ExpenseResponse>>(`/api/expenses?${searchParams.toString()}`),
  });
}

export function useExpense(id: string) {
  const fetchWithAuth = useAuthFetch();
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => fetchWithAuth<{ data: ExpenseResponse }>(`/api/expenses/${id}`),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchWithAuth<{ data: ExpenseResponse }>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useDeleteExpense() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/api/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useUpdateExpense() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) =>
      fetchWithAuth<{ data: ExpenseResponse }>(`/api/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

// ─── Summary (period toggle) ────────────────────────────────────────────────

export function useSummary(period: string, from?: string, to?: string, categoryId?: string) {
  const fetchWithAuth = useAuthFetch();
  const params = new URLSearchParams({ period });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (categoryId) params.set('category_id', categoryId);
  return useQuery({
    queryKey: ['summary', period, from, to, categoryId],
    queryFn: () =>
      fetchWithAuth<{ data: SummaryResponse }>(`/api/expenses/summary?${params.toString()}`),
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function useCategories() {
  const fetchWithAuth = useAuthFetch();
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchWithAuth<{ data: CategoryResponse[] }>('/api/categories'),
  });
}

export function useCreateCategory() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; icon?: string; color?: string }) =>
      fetchWithAuth<{ data: CategoryResponse }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// ─── Insights ────────────────────────────────────────────────────────────────

export function useInsightSummary() {
  const fetchWithAuth = useAuthFetch();
  return useQuery({
    queryKey: ['insights', 'summary'],
    queryFn: () => fetchWithAuth<{ data: InsightSummaryResponse }>('/api/insights/summary'),
  });
}

export function useTrends(months = 6) {
  const fetchWithAuth = useAuthFetch();
  return useQuery({
    queryKey: ['insights', 'trends', months],
    queryFn: () => fetchWithAuth<{ data: TrendsResponse }>(`/api/insights/trends?months=${months}`),
  });
}

export function useDrilldown(
  level: string,
  period: string,
  from?: string,
  to?: string,
  categoryId?: string,
  subcategoryId?: string,
  paymentMode?: string,
) {
  const fetchWithAuth = useAuthFetch();
  const params = new URLSearchParams({ level, period });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (categoryId) params.set('category_id', categoryId);
  if (subcategoryId) params.set('subcategory_id', subcategoryId);
  if (paymentMode) params.set('payment_mode', paymentMode);
  return useQuery({
    queryKey: ['insights', 'drilldown', level, period, from, to, categoryId, subcategoryId, paymentMode],
    queryFn: () => fetchWithAuth<{ data: any }>(`/api/insights/drilldown?${params.toString()}`),
  });
}

export function useItemStats(query: string, from?: string, to?: string, paymentMode?: string) {
  const fetchWithAuth = useAuthFetch();
  const params = new URLSearchParams({ q: query });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (paymentMode) params.set('payment_mode', paymentMode);
  return useQuery({
    queryKey: ['insights', 'item-stats', query, from, to, paymentMode],
    queryFn: () => fetchWithAuth<{ data: any }>(`/api/insights/item-stats?${params.toString()}`),
    enabled: query.length >= 2,
  });
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

export function useBudgetProgress(month: string) {
  const fetchWithAuth = useAuthFetch();
  return useQuery({
    queryKey: ['budgets', 'progress', month],
    queryFn: () =>
      fetchWithAuth<{
        data: {
          id: string;
          categoryId: string | null;
          categoryName: string;
          categoryIcon: string;
          categoryColor: string;
          limit: number;
          spent: number;
          percentage: number;
        }[];
      }>(`/api/budgets/progress?month=${month}`),
  });
}

export function useBudgets() {
  const fetchWithAuth = useAuthFetch();
  return useQuery({
    queryKey: ['budgets'],
    queryFn: () => fetchWithAuth<{ data: any[] }>('/api/budgets'),
  });
}

export function useCreateBudget() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { category_id?: string; monthly_limit: number; month: string }) =>
      fetchWithAuth('/api/budgets', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudget() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/api/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

// ─── Income ──────────────────────────────────────────────────────────────────

export function useIncomes(from?: string, to?: string) {
  const fetchWithAuth = useAuthFetch();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return useQuery({
    queryKey: ['incomes', from, to],
    queryFn: () => fetchWithAuth<{ data: any[] }>(`/api/incomes?${params.toString()}`),
  });
}

export function useCreateIncome() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchWithAuth('/api/incomes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useDeleteIncome() {
  const fetchWithAuth = useAuthFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/api/incomes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
