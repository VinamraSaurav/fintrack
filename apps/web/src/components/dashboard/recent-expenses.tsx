'use client';

import Link from 'next/link';
import { useExpenses } from '@/hooks/use-expenses';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';

const AVATAR_TONES = [
  'from-primary to-teal-500',
  'from-secondary to-rose-400',
  'from-amber-500 to-orange-400',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-lime-400',
];

function hashLabel(value: string) {
  return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join('') || '₹'
  );
}

export function RecentExpenses() {
  const { data, isLoading } = useExpenses({ limit: '3', sort: 'date_desc' });

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
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Activity
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Recent expenses</h3>
        </div>
        <Link
          href="/dashboard/expenses"
          className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-primary transition hover:text-primary/80"
        >
          View all
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 py-10 text-center">
          <p className="text-sm text-slate-500">No expenses yet</p>
          <Link href="/dashboard/expenses/new" className="btn btn-primary btn-sm mt-4">
            Add your first expense
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 rounded-[24px] border border-white/70 bg-white/70 px-3 py-3 transition hover:bg-white/80"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br text-sm font-semibold text-white ${AVATAR_TONES[hashLabel(expense.items[0]?.categoryName ?? expense.title ?? expense.id) % AVATAR_TONES.length]}`}
              >
                {getInitials(expense.items[0]?.categoryName ?? expense.title ?? 'Expense')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {expense.title ?? expense.items.map((i) => i.displayName).join(', ')}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{formatRelativeDate(expense.expenseDate)}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>
                    {expense.items.length} item{expense.items.length > 1 ? 's' : ''}
                  </span>
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(expense.totalAmount, expense.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
