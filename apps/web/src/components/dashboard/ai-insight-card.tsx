'use client';

import Link from 'next/link';
import { useInsightSummary } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';

export function AIInsightCard() {
  const { data } = useInsightSummary();
  const summary = data?.data;

  if (!summary) return null;

  const direction = summary.changePercent >= 0 ? 'more' : 'less';
  const absChange = Math.abs(summary.changePercent);

  return (
    <div className="card-elevated flex items-start gap-3 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
        🧠
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-700">
          You&apos;ve spent <strong>{formatCurrency(summary.currentMonth.total)}</strong> this month
          ({absChange}% {direction} than last month).
          {summary.currentMonth.topCategory !== 'None' && (
            <> Your biggest category is <strong>{summary.currentMonth.topCategory}</strong>.</>
          )}
        </p>
        <Link href="/dashboard/insights" className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
          Ask AI for detailed analysis →
        </Link>
      </div>
    </div>
  );
}
