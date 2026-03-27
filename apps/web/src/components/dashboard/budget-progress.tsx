'use client';

import { useBudgetProgress } from '@/hooks/use-expenses';
import { formatCurrency, formatMonthValue, getCurrentMonthValue } from '@/lib/utils';
import Link from 'next/link';

export function BudgetProgress() {
  const currentMonth = getCurrentMonthValue();
  const { data, isLoading } = useBudgetProgress(currentMonth);

  if (isLoading) return null;

  const budgets = data?.data ?? [];
  if (budgets.length === 0) {
    return (
      <div className="card-elevated flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Budgets
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">Create your first guardrail</p>
          <p className="mt-1 text-sm text-slate-500">
            Set monthly caps so overspend stands out before it snowballs.
          </p>
        </div>
        <Link href="/dashboard/budgets" className="btn btn-primary btn-sm">
          Set Budget
        </Link>
      </div>
    );
  }

  return (
    <div className="card-elevated space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Budgets
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Budget progress</h3>
        </div>
        <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500">
          {formatMonthValue(currentMonth)}
        </span>
      </div>

      {[...budgets]
        .sort((a, b) => b.percentage - a.percentage)
        .map((b) => {
          const color = b.percentage >= 90 ? '#ef4444' : b.percentage >= 70 ? '#f59e0b' : '#10b981';
          const remaining = b.limit - b.spent;
          const status =
            remaining >= 0
              ? `${formatCurrency(remaining)} left`
              : `${formatCurrency(Math.abs(remaining))} over`;

          return (
            <div key={b.id} className="rounded-[24px] border border-white/70 bg-white/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-[18px] text-lg"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {b.categoryIcon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{b.categoryName}</p>
                    <p className="text-xs text-slate-400">{status}</p>
                  </div>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {Math.round(b.percentage)}%
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                </span>
                <span>
                  {b.percentage >= 100
                    ? 'Over budget'
                    : b.percentage >= 85
                      ? 'Close to limit'
                      : 'On track'}
                </span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(b.percentage, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}
