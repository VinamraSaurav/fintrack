'use client';

import type { PeriodBreakdown, CategoryBreakdown } from '@fintrack/shared';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface SpendingChartProps {
  byPeriod: PeriodBreakdown[];
  byCategory: CategoryBreakdown[];
  isLoading?: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#6b7280'];

export function SpendingChart({ byPeriod, byCategory, isLoading }: SpendingChartProps) {
  if (isLoading) {
    return <div className="card-elevated h-80 animate-pulse"><div className="h-full rounded bg-gray-50" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="card-elevated">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Spending Over Time</h3>
        <div className="h-56">
          {byPeriod.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPeriod.map((p) => ({ name: p.label, total: Math.round(p.total) }))} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} width={55} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card-elevated">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">By Category</h3>
        {byCategory.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No category data</p>
        ) : (
          <div className="space-y-2.5">
            {byCategory
              .sort((a, b) => b.total - a.total)
              .map((cat, i) => {
                const totalAll = byCategory.reduce((s, c) => s + c.total, 0);
                const pct = totalAll > 0 ? Math.round((cat.total / totalAll) * 100) : 0;
                return (
                  <div key={cat.categoryId} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="w-24 truncate text-xs text-gray-600">{cat.name}</span>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                    <span className="w-8 text-right text-[10px] text-gray-400">{pct}%</span>
                    <span className="w-16 text-right text-xs font-medium text-gray-900">{formatCurrency(cat.total)}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
