'use client';

import Link from 'next/link';
import { useExpenses } from '@/hooks/use-expenses';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';

export function RecentExpenses() {
  const { data, isLoading } = useExpenses({ limit: '5', sort: 'date_desc' });

  if (isLoading) {
    return (
      <div className="card-elevated">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Recent</h3>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 py-3">
            <div className="h-9 w-9 rounded-full bg-gray-100" />
            <div className="flex-1">
              <div className="h-3.5 w-28 rounded bg-gray-100" />
              <div className="mt-1.5 h-3 w-16 rounded bg-gray-100" />
            </div>
            <div className="h-3.5 w-14 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  const expenses = data?.data ?? [];

  return (
    <div className="card-elevated">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Recent</h3>
        <Link href="/dashboard/expenses" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">No expenses yet</p>
          <Link href="/dashboard/expenses/new" className="btn btn-primary btn-sm mt-3">
            Add your first expense
          </Link>
        </div>
      ) : (
        <div className="space-y-0">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 border-b border-gray-50 py-2.5 last:border-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm">
                {expense.items[0]?.categoryName?.[0] ?? '💰'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {expense.title ?? expense.items.map((i) => i.displayName).join(', ')}
                </p>
                <p className="text-xs text-gray-400">
                  {formatRelativeDate(expense.expenseDate)}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(expense.totalAmount, expense.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
