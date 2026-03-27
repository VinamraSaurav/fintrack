'use client';

import { formatCurrency } from '@/lib/utils';
import { useInsightSummary } from '@/hooks/use-expenses';
import { cn } from '@/lib/utils';

function StatIcon({ d }: { d: string }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export function SummaryCards() {
  const { data, isLoading } = useInsightSummary();

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-3 w-16 rounded bg-gray-100" />
              <div className="mt-3 h-6 w-20 rounded bg-gray-100" />
              <div className="mt-3 h-8 rounded-2xl bg-gray-100" />
            </div>
          ))}
        </div>

        <div className="hidden grid-cols-4 gap-4 lg:grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-3 w-20 rounded bg-gray-100" />
              <div className="mt-4 h-8 w-24 rounded bg-gray-100" />
              <div className="mt-3 h-4 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </>
    );
  }

  const summary = data?.data;
  if (!summary) return null;

  const cards = [
    {
      label: 'This Month',
      value: formatCurrency(summary.currentMonth.total),
      sub: `${summary.currentMonth.count} expenses logged`,
      badge: 'Live',
      desktopTone: 'bg-primary/5',
      desktopAccent: 'text-slate-900',
      accent: 'text-slate-900',
      iconWrap: 'bg-primary/10 text-primary',
      surface: 'from-primary/20 via-primary/5 to-white',
      icon: 'M12 8c-1.768 0-3.204 1.343-3.204 3s1.436 3 3.204 3 3.204-1.343 3.204-3-1.436-3-3.204-3zm0 8.25c-3.247 0-5.88-2.35-5.88-5.25S8.753 5.75 12 5.75s5.88 2.35 5.88 5.25-2.633 5.25-5.88 5.25zM4.75 12a7.25 7.25 0 0114.5 0 7.25 7.25 0 01-14.5 0z',
    },
    {
      label: 'Last Month',
      value: formatCurrency(summary.previousMonth.total),
      sub: `${summary.previousMonth.count} expenses logged`,
      badge: 'Baseline',
      desktopTone: 'bg-white',
      desktopAccent: 'text-slate-900',
      accent: 'text-slate-900',
      iconWrap: 'bg-slate-100 text-slate-600',
      surface: 'from-slate-100 via-white to-white',
      icon: 'M5 12h14M12 5l7 7-7 7',
    },
    {
      label: 'Change',
      value: `${summary.changePercent >= 0 ? '+' : ''}${summary.changePercent}%`,
      sub: summary.changePercent >= 0 ? 'More than last month' : 'Less than last month',
      badge: 'Momentum',
      desktopTone: summary.changePercent >= 0 ? 'bg-red-50/70' : 'bg-emerald-50/70',
      desktopAccent: summary.changePercent >= 0 ? 'text-red-600' : 'text-emerald-600',
      accent: summary.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600',
      iconWrap:
        summary.changePercent >= 0
          ? 'bg-rose-100 text-rose-500'
          : 'bg-emerald-100 text-emerald-600',
      surface:
        summary.changePercent >= 0
          ? 'from-rose-100 via-white to-white'
          : 'from-emerald-100 via-white to-white',
      icon: summary.changePercent >= 0 ? 'M3 17l6-6 4 4 7-7' : 'M3 7l6 6 4-4 7 7',
    },
    {
      label: 'Top Category',
      value:
        summary.currentMonth.topCategory === 'None'
          ? 'Needs tagging'
          : summary.currentMonth.topCategory,
      sub: 'Highest spend',
      badge: 'Focus',
      desktopTone: 'bg-white',
      desktopAccent: 'text-primary',
      accent: 'text-slate-900',
      iconWrap: 'bg-secondary/10 text-secondary',
      surface: 'from-secondary/20 via-white to-white',
      icon: 'M11.25 3.75h1.5m-4.5 4.5h6m-8.25 4.5h10.5M8.25 17.25h7.5',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn('stat-card overflow-hidden bg-gradient-to-br', card.surface)}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {card.badge}
              </span>
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-2xl',
                  card.iconWrap,
                )}
              >
                <StatIcon d={card.icon} />
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {card.label}
            </p>
            <p
              className={cn('mt-1.5 text-lg font-bold leading-tight', card.accent)}
              title={card.value}
            >
              {card.value}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="hidden grid-cols-4 gap-4 lg:grid">
        {cards.map((card) => (
          <div key={card.label} className={cn('stat-card', card.desktopTone)}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className={cn('mt-2 text-[2rem] font-bold leading-none', card.desktopAccent)}>
              {card.value}
            </p>
            <p className="mt-3 text-sm text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>
    </>
  );
}
