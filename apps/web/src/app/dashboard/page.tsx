'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { AIInsightCard } from '@/components/dashboard/ai-insight-card';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { RecentExpenses } from '@/components/dashboard/recent-expenses';
import { DrilldownAnalytics } from '@/components/dashboard/drilldown-analytics';
import { useItemStats } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [itemQuery, setItemQuery] = useState('');
  const { data: itemStatsData } = useItemStats(itemQuery);
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

      <DrilldownAnalytics />

      <div className="card-elevated">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-badge">Item lookup</span>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              Track price drift item by item
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Search for a grocery, bill line, or recurring item to inspect quantities, prices, and
              recent receipts.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Search item
            </label>
            <input
              type="text"
              className="input-clean"
              placeholder="Try potato, milk, petrol..."
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
            />
          </div>
        </div>

        {itemStatsData?.data && itemQuery.length >= 2 ? (
          (() => {
            const { stats, monthlyBreakdown, recentItems } = itemStatsData.data;
            if (stats.purchaseCount === 0) {
              return (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm text-slate-500">
                  No purchases found for &ldquo;{itemQuery}&rdquo;
                </div>
              );
            }

            return (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Total spent
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatCurrency(stats.totalSpent)}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Total qty
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalQuantity}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Avg price / unit
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatCurrency(stats.avgUnitPrice)}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Purchases
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{stats.purchaseCount}</p>
                  </div>
                </div>

                {monthlyBreakdown.length > 1 && (
                  <div className="rounded-[24px] border border-white/70 bg-white/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Monthly spend trend</p>
                        <p className="text-xs text-slate-400">
                          Helps surface price drift across receipts
                        </p>
                      </div>
                    </div>

                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyBreakdown.map((m: any) => ({
                            name: m.month,
                            total: Math.round(m.total),
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                            width={45}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              fontSize: '11px',
                            }}
                          />
                          <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto rounded-[24px] border border-white/70 bg-white/70">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3">Unit</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.slice(0, 10).map((item: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 text-sm last:border-0">
                          <td className="px-4 py-3 text-xs text-slate-500">{item.date}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.displayName}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {item.categoryName ?? '-'}
                            {item.subcategoryName ? ` / ${item.subcategoryName}` : ''}
                          </td>
                          <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{item.unit ?? '-'}</td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm text-slate-500">
            {itemQuery.length > 0 && itemQuery.length < 2
              ? 'Type at least 2 characters'
              : 'Search for an item to see spending history, quantity consumed, and average price.'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BudgetProgress />
        <RecentExpenses />
      </div>
    </div>
  );
}
