'use client';

import Link from 'next/link';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { AIInsightCard } from '@/components/dashboard/ai-insight-card';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { RecentExpenses } from '@/components/dashboard/recent-expenses';

export default function DashboardPage() {
  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <div className="page-container space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Your financial dashboard at a glance</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
            {todayLabel}
          </span>
          <Link href="/dashboard/expenses/new" className="btn btn-primary btn-sm gap-2 text-white">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </Link>
          <Link href="/dashboard/entries" className="btn btn-ghost btn-sm">
            View Entries
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <SummaryCards />
        <AIInsightCard />
      </div>

      <div className="card-elevated overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary text-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              Analytics
            </span>
            <h2 className="mt-4 text-2xl font-bold">Go deeper than the monthly snapshot</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Drill from categories to subcategories to items, compare the selected date range, and
              inspect item-level purchase trends from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/insights"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Open Analytics
            </Link>
            <Link
              href="/dashboard/entries"
              className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Review Entries
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BudgetProgress />
        <RecentExpenses />
      </div>
    </div>
  );
}
