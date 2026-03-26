'use client';

import { useInsightSummary } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';

export function SummaryCards() {
  const { data, isLoading } = useInsightSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="mt-3 h-7 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  const summary = data?.data;
  if (!summary) return null;

  const cards = [
    {
      label: 'This Month',
      value: formatCurrency(summary.currentMonth.total),
      sub: `${summary.currentMonth.count} expenses`,
      accent: 'text-gray-900',
      bg: 'bg-primary/5',
    },
    {
      label: 'Last Month',
      value: formatCurrency(summary.previousMonth.total),
      sub: `${summary.previousMonth.count} expenses`,
      accent: 'text-gray-600',
      bg: '',
    },
    {
      label: 'Change',
      value: `${summary.changePercent >= 0 ? '+' : ''}${summary.changePercent}%`,
      sub: summary.changePercent >= 0 ? 'More than last month' : 'Less than last month',
      accent: summary.changePercent >= 0 ? 'text-red-600' : 'text-emerald-600',
      bg: summary.changePercent >= 0 ? 'bg-red-50' : 'bg-emerald-50',
    },
    {
      label: 'Top Category',
      value: summary.currentMonth.topCategory,
      sub: 'Highest spend',
      accent: 'text-primary',
      bg: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`stat-card ${card.bg}`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
          <p className={`mt-1 text-xl font-bold ${card.accent}`}>{card.value}</p>
          <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
