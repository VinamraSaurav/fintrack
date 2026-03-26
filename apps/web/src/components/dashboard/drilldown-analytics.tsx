'use client';

import { useState } from 'react';
import { useDrilldown, useCategories } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#6b7280', '#14b8a6', '#f43f5e', '#a3e635'];

const PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' },
] as const;

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateRange(period: string) {
  const now = new Date();
  const to = localDate(now);
  let from: string;

  switch (period) {
    case 'daily':
      from = to;
      break;
    case 'weekly': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      from = localDate(monday);
      break;
    }
    case 'monthly':
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      break;
    case 'yearly':
      from = `${now.getFullYear()}-01-01`;
      break;
    default:
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  return { from, to };
}

interface BreadcrumbItem {
  label: string;
  level: 'category' | 'subcategory' | 'item';
  categoryId?: string;
  subcategoryId?: string;
}

export function DrilldownAnalytics() {
  const [period, setPeriod] = useState('monthly');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: 'All Categories', level: 'category' },
  ]);

  const current = breadcrumbs[breadcrumbs.length - 1];
  const { from, to } = getDateRange(period);
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data ?? [];

  const { data: drilldownData, isLoading } = useDrilldown(
    current.level,
    period,
    from,
    to,
    current.categoryId,
    current.subcategoryId,
  );

  const distribution = drilldownData?.data?.distribution ?? [];
  const timeSeries = drilldownData?.data?.timeSeries ?? [];
  const totalAll = distribution.reduce((s: number, d: any) => s + (d.total ?? 0), 0);

  const drillInto = (item: any) => {
    if (current.level === 'category' && item.id) {
      const cat = categories.find((c: any) => c.id === item.id);
      setBreadcrumbs([
        ...breadcrumbs,
        {
          label: item.name ?? 'Unknown',
          level: 'subcategory',
          categoryId: item.id,
        },
      ]);
    } else if (current.level === 'subcategory' && item.id) {
      setBreadcrumbs([
        ...breadcrumbs,
        {
          label: item.name ?? 'Unknown',
          level: 'item',
          categoryId: current.categoryId,
          subcategoryId: item.id,
        },
      ]);
    }
    // Item level — no deeper drill
  };

  const goTo = (index: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const chartData = timeSeries.map((t: any) => ({
    name: String(t.period).length > 7 ? String(t.period).slice(5) : t.period,
    total: Math.round(t.total),
  }));

  const pieData = distribution
    .filter((d: any) => d.total > 0)
    .map((d: any) => ({ name: d.name ?? 'Uncategorized', value: Math.round(d.total) }));

  return (
    <div className="space-y-4">
      {/* Header: Breadcrumbs + Period toggle */}
      <div className="card-elevated !p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">/</span>}
                <button
                  className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                    i === breadcrumbs.length - 1
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => goTo(i)}
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </div>

          <div className="ml-auto" />

          {/* Period toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  period === p.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Total */}
          <div className="text-right">
            <p className="text-base font-bold text-gray-900 tabular-nums">{formatCurrency(totalAll)}</p>
            <p className="text-[10px] text-gray-400">
              {from === to ? from : `${from} — ${to}`}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card-elevated h-64 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Time series chart — 2 cols */}
          <div className="card-elevated lg:col-span-2">
            <h3 className="mb-3 text-xs font-semibold text-gray-900">
              Spending Over Time
              <span className="ml-1 font-normal text-gray-400">
                ({PERIODS.find((p) => p.value === period)?.label})
              </span>
            </h3>
            <div className="h-52">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">No data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {(period === 'daily' || period === 'weekly') ? (
                    <BarChart data={chartData} barCategoryGap="15%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} width={45} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="total" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} width={45} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Distribution pie — 1 col */}
          <div className="card-elevated">
            <h3 className="mb-3 text-xs font-semibold text-gray-900">Distribution</h3>
            <div className="h-40">
              {pieData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                      {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '10px' }} formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Distribution table — clickable to drill down */}
      {distribution.length > 0 && (
        <div className="card-elevated overflow-x-auto !p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                <th className="px-4 py-2.5">
                  {current.level === 'category' ? 'Category' : current.level === 'subcategory' ? 'Subcategory' : 'Item'}
                </th>
                {current.level === 'item' && <th className="px-4 py-2.5 text-right">Total Qty</th>}
                {current.level === 'item' && <th className="px-4 py-2.5 text-right">Avg Price/Unit</th>}
                <th className="px-4 py-2.5 text-right">Purchases</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {distribution.map((item: any, i: number) => {
                const pct = totalAll > 0 ? Math.round((item.total / totalAll) * 100) : 0;
                const canDrill = current.level !== 'item';
                return (
                  <tr
                    key={item.id ?? item.name ?? i}
                    className={`border-b border-gray-50 text-sm ${canDrill ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-gray-50/50'}`}
                    onClick={() => canDrill && drillInto(item)}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-800">{item.name ?? 'Uncategorized'}</span>
                        {item.icon && <span className="text-xs">{item.icon}</span>}
                        {canDrill && (
                          <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </td>
                    {current.level === 'item' && (
                      <td className="px-4 py-2 text-right text-xs tabular-nums text-gray-600">
                        {item.qty} {item.unit ?? ''}
                      </td>
                    )}
                    {current.level === 'item' && (
                      <td className="px-4 py-2 text-right text-xs tabular-nums text-gray-500">
                        {formatCurrency(Math.round((item.avgPrice ?? 0) * 100) / 100)}
                      </td>
                    )}
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-gray-500">{item.count}</td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums text-gray-900">{formatCurrency(item.total)}</td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
