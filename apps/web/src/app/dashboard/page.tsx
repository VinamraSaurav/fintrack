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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [itemQuery, setItemQuery] = useState('');
  const { data: itemStatsData } = useItemStats(itemQuery);

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500">Your financial dashboard</p>
        </div>
        <Link href="/dashboard/expenses/new" className="btn btn-primary btn-sm gap-1 text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Link>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* AI Insight */}
      <AIInsightCard />

      {/* Drilldown Analytics: Category → Subcategory → Item */}
      <DrilldownAnalytics />

      {/* Item Analytics */}
      <div className="card-elevated">
        <div className="mb-3 flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Item Lookup</h3>
          <input
            type="text"
            className="input-clean w-48 text-xs"
            placeholder="Search item (e.g. potato, milk)"
            value={itemQuery}
            onChange={(e) => setItemQuery(e.target.value)}
          />
        </div>

        {itemStatsData?.data && itemQuery.length >= 2 ? (() => {
          const { stats, monthlyBreakdown, recentItems } = itemStatsData.data;
          if (stats.purchaseCount === 0) {
            return <p className="py-4 text-center text-xs text-gray-400">No purchases found for &ldquo;{itemQuery}&rdquo;</p>;
          }
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] uppercase text-gray-400">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] uppercase text-gray-400">Total Qty</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalQuantity}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] uppercase text-gray-400">Avg Price/Unit</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.avgUnitPrice)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] uppercase text-gray-400">Purchases</p>
                  <p className="text-lg font-bold text-gray-900">{stats.purchaseCount}</p>
                </div>
              </div>

              {monthlyBreakdown.length > 1 && (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBreakdown.map((m: any) => ({ name: m.month, total: Math.round(m.total) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} width={45} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
                      <Bar dataKey="total" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentItems.slice(0, 10).map((item: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 text-xs">
                        <td className="px-3 py-1.5 text-gray-500">{item.date}</td>
                        <td className="px-3 py-1.5 font-medium text-gray-900">{item.displayName}</td>
                        <td className="px-3 py-1.5 text-gray-400">{item.categoryName ?? '-'}{item.subcategoryName ? ` / ${item.subcategoryName}` : ''}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-1.5 text-gray-400">{item.unit ?? '-'}</td>
                        <td className="px-3 py-1.5 text-right font-medium tabular-nums text-gray-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })() : (
          <p className="py-3 text-center text-xs text-gray-400">
            {itemQuery.length > 0 && itemQuery.length < 2 ? 'Type at least 2 characters' : 'Search for an item to see spending history, units consumed, and avg price'}
          </p>
        )}
      </div>

      {/* Budget + Recent */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BudgetProgress />
        <RecentExpenses />
      </div>
    </div>
  );
}
