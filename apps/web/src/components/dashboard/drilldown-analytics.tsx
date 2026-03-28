'use client';

import { useState } from 'react';
import { useDrilldown } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#3b82f6',
  '#ec4899',
  '#f59e0b',
  '#6b7280',
  '#14b8a6',
  '#f43f5e',
  '#a3e635',
];

const PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' },
] as const;

type PeriodValue = (typeof PERIODS)[number]['value'];

const weekdayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
const fullDateFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildChartData(period: PeriodValue, timeSeries: any[], from: string, to: string) {
  const totals = new Map<string, number>(
    timeSeries.map((point: any) => [String(point.period), Math.round(Number(point.total ?? 0))]),
  );

  if (period === 'daily') {
    const date = parseLocalDate(to);
    return [
      {
        name: 'Today',
        total: totals.get(to) ?? 0,
        tooltipLabel: fullDateFormatter.format(date),
      },
    ];
  }

  if (period === 'weekly' || period === 'monthly') {
    const points = [];
    for (
      let cursor = parseLocalDate(from);
      cursor <= parseLocalDate(to);
      cursor = addDays(cursor, 1)
    ) {
      const key = localDate(cursor);
      points.push({
        name: period === 'weekly' ? weekdayFormatter.format(cursor) : String(cursor.getDate()),
        total: totals.get(key) ?? 0,
        tooltipLabel: fullDateFormatter.format(cursor),
      });
    }
    return points;
  }

  const points = [];
  const cursor = new Date(parseLocalDate(from).getFullYear(), parseLocalDate(from).getMonth(), 1);
  const end = parseLocalDate(to);

  while (
    cursor.getFullYear() < end.getFullYear() ||
    (cursor.getFullYear() === end.getFullYear() && cursor.getMonth() <= end.getMonth())
  ) {
    const key = monthKey(cursor);
    points.push({
      name: monthFormatter.format(cursor),
      total: totals.get(key) ?? 0,
      tooltipLabel: `${monthFormatter.format(cursor)} ${cursor.getFullYear()}`,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return points;
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
  const canGoBack = breadcrumbs.length > 1;
  const previousCrumb = canGoBack ? breadcrumbs[breadcrumbs.length - 2] : null;

  const drillInto = (item: any) => {
    if (current.level === 'category' && item.id) {
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

  const goBack = () => {
    if (!canGoBack) return;
    setBreadcrumbs(breadcrumbs.slice(0, -1));
  };

  const chartData = buildChartData(period as PeriodValue, timeSeries, from, to);
  const pieData = distribution
    .filter((d: any) => d.total > 0)
    .map((d: any) => ({ name: d.name ?? 'Uncategorized', value: Math.round(d.total) }));
  const isBarChart = period === 'daily' || period === 'weekly';
  const xAxisInterval = period === 'monthly' ? 4 : 0;
  const currentLevelLabel =
    current.level === 'category'
      ? 'Categories'
      : current.level === 'subcategory'
        ? 'Subcategories'
        : 'Items';

  return (
    <div className="space-y-4">
      {/* Header: Breadcrumbs + Period toggle */}
      <div className="card-elevated !p-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                {canGoBack && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="hidden items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary/20 hover:text-primary sm:inline-flex"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}

                <span className="rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                  {currentLevelLabel}
                </span>

                <p className="text-sm text-slate-500">
                  Viewing <span className="font-semibold text-slate-900">{current.label}</span>
                </p>
              </div>

              <div className="-mx-1 overflow-x-auto pb-1">
                <div className="flex min-w-max items-center gap-1 px-1 text-sm">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-gray-300">/</span>}
                      <button
                        type="button"
                        className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                          i === breadcrumbs.length - 1
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-gray-500 hover:bg-white hover:text-gray-700'
                        }`}
                        onClick={() => goTo(i)}
                      >
                        {crumb.label}
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {canGoBack && previousCrumb && (
                <p className="text-xs text-slate-400">
                  Back returns you to{' '}
                  <span className="font-medium text-slate-500">{previousCrumb.label}</span>.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="inline-flex rounded-full border border-slate-200/80 bg-white/80 p-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      period === p.value
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setPeriod(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="rounded-[20px] bg-slate-50/80 px-3 py-2 text-right">
                <p className="text-base font-bold text-gray-900 tabular-nums">
                  {formatCurrency(totalAll)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {from === to ? from : `${from} — ${to}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card-elevated h-64 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Time series chart — 2 cols */}
          <div className="card-elevated lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Spending Over Time
              <span className="ml-1 font-normal text-gray-400">
                ({PERIODS.find((p) => p.value === period)?.label})
              </span>
            </h3>
            <div className="h-52">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  No data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {isBarChart ? (
                    <BarChart data={chartData} barCategoryGap="15%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        interval={xAxisInterval}
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
                        labelFormatter={(label, payload) =>
                          payload?.[0]?.payload?.tooltipLabel ?? String(label)
                        }
                        formatter={(v: number) => formatCurrency(v)}
                      />
                      <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        interval={xAxisInterval}
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
                        labelFormatter={(label, payload) =>
                          payload?.[0]?.payload?.tooltipLabel ?? String(label)
                        }
                        formatter={(v: number) => formatCurrency(v)}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ fill: '#6366f1', r: 3 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Distribution pie — 1 col */}
          <div className="card-elevated">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Distribution</h3>
            <div className="h-40">
              {pieData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '10px',
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Distribution table — clickable to drill down */}
      {distribution.length > 0 && (
        <>
          <div className="card-elevated space-y-3 md:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {current.level === 'category'
                    ? 'Categories'
                    : current.level === 'subcategory'
                      ? 'Subcategories'
                      : 'Items'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {current.level === 'item' ? 'Quick totals for each item.' : 'Tap a card to drill deeper.'}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">{distribution.length} shown</p>
            </div>

            <div className="space-y-2">
              {distribution.map((item: any, i: number) => {
                const pct = totalAll > 0 ? Math.round((item.total / totalAll) * 100) : 0;
                const canDrill = current.level !== 'item';
                return (
                  <button
                    key={item.id ?? item.name ?? i}
                    type="button"
                    className={`w-full rounded-[24px] border border-gray-100 bg-white/80 px-4 py-3 text-left transition ${
                      canDrill ? 'hover:border-primary/20 hover:bg-primary/5' : 'cursor-default'
                    }`}
                    onClick={() => canDrill && drillInto(item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.name ?? 'Uncategorized'}
                          </p>
                          {item.icon ? <span className="shrink-0 text-xs">{item.icon}</span> : null}
                        </div>
                        {canDrill ? (
                          <p className="mt-1 text-[11px] text-slate-400">
                            {current.level === 'category' ? 'Open subcategories' : 'Open items'}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                          {formatCurrency(item.total)}
                        </p>
                        {canDrill ? (
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-gray-50/80 px-3 py-2.5 text-[11px] text-slate-500">
                      <div>
                        <p className="uppercase tracking-[0.18em] text-slate-400">Purchases</p>
                        <p className="mt-1 font-medium text-slate-700">{item.count}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.18em] text-slate-400">Share</p>
                        <p className="mt-1 font-medium text-slate-700">{pct}%</p>
                      </div>
                      {current.level === 'item' ? (
                        <>
                          <div>
                            <p className="uppercase tracking-[0.18em] text-slate-400">Total Qty</p>
                            <p className="mt-1 font-medium text-slate-700">
                              {item.qty} {item.unit ?? ''}
                            </p>
                          </div>
                          <div>
                            <p className="uppercase tracking-[0.18em] text-slate-400">
                              Avg Price
                            </p>
                            <p className="mt-1 font-medium text-slate-700 tabular-nums">
                              {formatCurrency(Math.round((item.avgPrice ?? 0) * 100) / 100)}
                            </p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card-elevated hidden overflow-x-auto !p-0 md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-2.5">
                    {current.level === 'category'
                      ? 'Category'
                      : current.level === 'subcategory'
                        ? 'Subcategory'
                        : 'Item'}
                  </th>
                  {current.level === 'item' && (
                    <th className="px-4 py-2.5 text-right">Total Qty</th>
                  )}
                  {current.level === 'item' && (
                    <th className="px-4 py-2.5 text-right">Avg Price/Unit</th>
                  )}
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
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-800">{item.name ?? 'Uncategorized'}</span>
                              {item.icon && <span className="text-xs">{item.icon}</span>}
                            </div>
                            {canDrill && (
                              <p className="text-[11px] text-slate-400">
                                {current.level === 'category' ? 'View subcategories' : 'View items'}
                              </p>
                            )}
                          </div>
                          {canDrill && (
                            <svg
                              className="h-3 w-3 text-gray-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
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
                      <td className="px-4 py-2 text-right text-xs tabular-nums text-gray-500">
                        {item.count}
                      </td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-gray-500">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {canGoBack && previousCrumb && (
        <div className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 lg:hidden bottom-[calc(env(safe-area-inset-bottom)+5.75rem)]">
          <button
            type="button"
            onClick={goBack}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_18px_35px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl transition hover:border-primary/25 hover:text-primary"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to {previousCrumb.label}
          </button>
        </div>
      )}
    </div>
  );
}
