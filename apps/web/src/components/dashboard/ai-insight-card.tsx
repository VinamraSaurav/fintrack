'use client';

import Link from 'next/link';
import { useInsightSummary } from '@/hooks/use-expenses';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils';

export function AIInsightCard() {
  const { data } = useInsightSummary();
  const summary = data?.data;

  if (!summary) return null;

  const direction = summary.changePercent >= 0 ? 'more' : 'less';
  const absChange = Math.abs(summary.changePercent);
  const topCategory =
    summary.currentMonth.topCategory === 'None'
      ? 'Untagged spend'
      : summary.currentMonth.topCategory;

  return (
    <>
      <div className="card-elevated !p-4 lg:hidden">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
            <svg
              className="h-4.5 w-4.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-2.842.813a1.125 1.125 0 0 0 0 2.124L9 22.5l.813 2.842a1.125 1.125 0 0 0 2.124 0L12.75 22.5l2.842-.813a1.125 1.125 0 0 0 0-2.124L12.75 18.75l-.813-2.846a1.125 1.125 0 0 0-2.124 0Z"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  AI brief
                </p>
                <h3 className="mt-0.5 text-[15px] font-semibold text-slate-900">Monthly pulse</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                {absChange}% {direction}
              </span>
            </div>

            <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
              You&apos;ve spent{' '}
              <strong className="text-slate-900">
                {formatCurrency(summary.currentMonth.total)}
              </strong>{' '}
              this month. Biggest spend bucket:{' '}
              <strong className="text-slate-900">{topCategory}</strong>.
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] text-primary">
                {summary.currentMonth.count} expenses
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-slate-500">
                {formatCurrencyCompact(summary.currentMonth.total)}
              </span>
            </div>

            <Link
              href="/dashboard/insights"
              className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
            >
              Open AI insights
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden rounded-[28px] border border-gray-200 bg-white px-5 py-4 shadow-[var(--card-shadow-soft)] lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg
              className="h-4.5 w-4.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-2.842.813a1.125 1.125 0 0 0 0 2.124L9 22.5l.813 2.842a1.125 1.125 0 0 0 2.124 0L12.75 22.5l2.842-.813a1.125 1.125 0 0 0 0-2.124L12.75 18.75l-.813-2.846a1.125 1.125 0 0 0-2.124 0Z"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1 text-sm text-slate-600">
            You&apos;ve spent{' '}
            <strong className="text-slate-900">{formatCurrency(summary.currentMonth.total)}</strong>{' '}
            this month. Top category: <strong className="text-slate-900">{topCategory}</strong>.
          </div>

          <Link
            href="/dashboard/insights"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View AI insights →
          </Link>
        </div>
      </div>
    </>
  );
}
