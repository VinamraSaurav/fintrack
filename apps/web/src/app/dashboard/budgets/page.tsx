'use client';

import { useState } from 'react';
import {
  useBudgets,
  useBudgetProgress,
  useCreateBudget,
  useDeleteBudget,
  useCategories,
  useInsightSummary,
} from '@/hooks/use-expenses';
import { formatCurrency, formatMonthValue, getCurrentMonthValue } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

export default function BudgetsPage() {
  const currentMonth = getCurrentMonthValue();
  const { data: progressData } = useBudgetProgress(currentMonth);
  const { data: budgetsData } = useBudgets();
  const { data: categoriesData } = useCategories();
  const { data: summaryData } = useInsightSummary();
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();

  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [isRecurring, setIsRecurring] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const categories = categoriesData?.data ?? [];
  const budgets = budgetsData?.data ?? [];
  const progress = progressData?.data ?? [];
  const summary = summaryData?.data;

  const totalBudget = progress.reduce((s, b) => s + b.limit, 0);
  const totalSpent =
    progress.length > 0
      ? progress.reduce((s, b) => s + b.spent, 0)
      : (summary?.currentMonth.total ?? 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit) return;
    await createBudget.mutateAsync({
      category_id: categoryId || undefined,
      monthly_limit: parseFloat(limit),
      month: isRecurring ? 'recurring' : month,
    });
    setCategoryId('');
    setLimit('');
  };

  return (
    <div className="page-container max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Budgets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set category guardrails for {formatMonthValue(currentMonth)}
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-gray-500">Total Budget</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {totalBudget > 0 ? formatCurrency(totalBudget) : 'Not set'}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">Spent ({currentMonth})</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatCurrency(summary?.currentMonth.total ?? totalSpent)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">Remaining</p>
          <p
            className={`mt-1 text-xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {totalBudget > 0 ? formatCurrency(totalBudget - totalSpent) : '-'}
          </p>
        </div>
      </div>

      {/* Add budget */}
      <form onSubmit={handleCreate} className="card-elevated space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Set Budget Limit</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              Category
            </label>
            <select
              className="select-clean"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Overall (all categories)</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              Monthly Limit (INR)
            </label>
            <input
              type="number"
              step="100"
              className="input-clean"
              placeholder="5000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              Period
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="period"
                  className="radio radio-primary radio-xs"
                  checked={isRecurring}
                  onChange={() => setIsRecurring(true)}
                />
                <span className="text-xs text-gray-600">Every month</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="period"
                  className="radio radio-primary radio-xs"
                  checked={!isRecurring}
                  onChange={() => setIsRecurring(false)}
                />
                <span className="text-xs text-gray-600">One-time</span>
              </label>
            </div>
            {!isRecurring && (
              <input
                type="month"
                className="input-clean mt-1 text-xs"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            )}
          </div>
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              className="btn btn-primary btn-sm w-full"
              disabled={!limit || createBudget.isPending}
            >
              {createBudget.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                'Set'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Budget progress */}
      {progress.length > 0 && (
        <div className="card-elevated space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">This Month&apos;s Progress</h2>
          {progress.map((b) => {
            const color =
              b.percentage >= 90 ? '#ef4444' : b.percentage >= 70 ? '#f59e0b' : '#10b981';
            const status =
              b.percentage >= 100
                ? 'Over budget!'
                : b.percentage >= 90
                  ? 'Almost there'
                  : b.percentage >= 70
                    ? 'Watch out'
                    : 'On track';
            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{b.categoryIcon}</span>
                    <span className="text-sm font-medium text-gray-800">{b.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-medium" style={{ color }}>
                      {status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                    <button
                      className="text-gray-300 hover:text-red-500"
                      onClick={() => setDeleteTarget(b.id)}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(b.percentage, 100)}%`, backgroundColor: color }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">{b.percentage}% used</p>
              </div>
            );
          })}
        </div>
      )}

      {/* All budgets list */}
      {budgets.length > 0 && (
        <div className="card-elevated">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">All Budgets</h2>
          <div className="space-y-2">
            {budgets.map((b: any) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-gray-50 bg-gray-50 px-3 py-2"
              >
                <span>{b.categoryIcon ?? '📊'}</span>
                <span className="flex-1 text-sm text-gray-700">{b.categoryName ?? 'Overall'}</span>
                <span className="text-xs text-gray-500">{formatCurrency(b.monthlyLimit)}/mo</span>
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {b.month === 'recurring' ? 'Recurring' : b.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove budget?"
        message="This budget limit will be removed. Your expense data is not affected."
        confirmLabel="Remove"
        onConfirm={() => {
          if (deleteTarget)
            deleteBudget.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
        }}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteBudget.isPending}
      />
    </div>
  );
}
