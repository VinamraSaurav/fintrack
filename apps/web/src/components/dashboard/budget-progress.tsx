'use client';

import { useBudgetProgress } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export function BudgetProgress() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data, isLoading } = useBudgetProgress(currentMonth);

  if (isLoading) return null;

  const budgets = data?.data ?? [];
  if (budgets.length === 0) {
    return (
      <div className="card-elevated flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Budget Tracking</p>
          <p className="text-xs text-gray-400">Set monthly limits for your categories</p>
        </div>
        <Link href="/dashboard/budgets" className="btn btn-ghost btn-xs text-primary">
          Set Budget
        </Link>
      </div>
    );
  }

  return (
    <div className="card-elevated space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Budget Progress</h3>
        <span className="text-[10px] text-gray-400 uppercase">{currentMonth}</span>
      </div>
      {budgets.map((b) => {
        const color =
          b.percentage >= 90 ? '#ef4444' : b.percentage >= 70 ? '#f59e0b' : '#10b981';
        return (
          <div key={b.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <span>{b.categoryIcon}</span>
                {b.categoryName}
              </span>
              <span className="text-xs text-gray-500">
                {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full transition-all"
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
