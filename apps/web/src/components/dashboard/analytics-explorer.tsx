'use client';

import { useMemo, useState } from 'react';
import { useDrilldown, useItemStats } from '@/hooks/use-expenses';
import { formatCurrency, getTodayDateValue } from '@/lib/utils';
import { PAYMENT_MODES } from '@fintrack/shared';
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

const QUICK_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
] as const;

type QuickRange = (typeof QUICK_RANGES)[number]['value'];
type BucketPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ScopeSummary {
  total: number;
  qty: number;
  count: number;
  avgPrice?: number;
  unit?: string | null;
}

interface BreadcrumbItem {
  label: string;
  level: 'category' | 'subcategory' | 'item';
  categoryId?: string;
  subcategoryId?: string;
  summary?: ScopeSummary;
}

const weekdayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
const fullDateFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getRangeFromPreset(preset: Exclude<QuickRange, 'custom'>) {
  const now = new Date();
  const to = getTodayDateValue(now);

  switch (preset) {
    case 'today':
      return { from: to, to };
    case 'week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      return { from: localDate(monday), to };
    }
    case 'month':
      return {
        from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        to,
      };
    case 'year':
      return {
        from: `${now.getFullYear()}-01-01`,
        to,
      };
  }
}

function normalizeRange(from: string, to: string) {
  return from <= to ? { from, to } : { from: to, to: from };
}

function getDaySpan(from: string, to: string) {
  const start = parseLocalDate(from).getTime();
  const end = parseLocalDate(to).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

function getBucketPeriod(from: string, to: string): BucketPeriod {
  const daySpan = getDaySpan(from, to);

  if (daySpan <= 1) return 'daily';
  if (daySpan <= 7) return 'weekly';
  if (daySpan <= 120) return 'monthly';
  return 'yearly';
}

function buildChartData(period: BucketPeriod, timeSeries: any[], from: string, to: string) {
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

function buildScopeSummary(current: BreadcrumbItem, distribution: any[]) {
  if (current.summary) {
    return {
      title: current.label,
      total: Number(current.summary.total ?? 0),
      qty: Number(current.summary.qty ?? 0),
      count: Number(current.summary.count ?? 0),
      avgMetricLabel: 'Avg spend / purchase',
      avgMetricValue:
        current.summary.count > 0 ? current.summary.total / current.summary.count : 0,
    };
  }

  const total = distribution.reduce((sum: number, item: any) => sum + Number(item.total ?? 0), 0);
  const qty = distribution.reduce((sum: number, item: any) => sum + Number(item.qty ?? 0), 0);
  const count = distribution.reduce((sum: number, item: any) => sum + Number(item.count ?? 0), 0);

  return {
    title: current.label,
    total,
    qty,
    count,
    avgMetricLabel: 'Avg spend / purchase',
    avgMetricValue: count > 0 ? total / count : 0,
  };
}

function getSearchPlaceholder(level: BreadcrumbItem['level']) {
  if (level === 'category') return 'Find a category';
  if (level === 'subcategory') return 'Find a subcategory';
  return 'Find an item';
}

export function AnalyticsExplorer() {
  const initialRange = getRangeFromPreset('month');
  const [quickRange, setQuickRange] = useState<QuickRange>('month');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: 'All Categories', level: 'category' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [paymentMode, setPaymentMode] = useState('');

  const range = normalizeRange(from, to);
  const bucketPeriod = getBucketPeriod(range.from, range.to);
  const current = breadcrumbs[breadcrumbs.length - 1];
  const canGoBack = breadcrumbs.length > 1;
  const previousCrumb = canGoBack ? breadcrumbs[breadcrumbs.length - 2] : null;

  const { data: drilldownData, isLoading } = useDrilldown(
    current.level,
    bucketPeriod,
    range.from,
    range.to,
    current.categoryId,
    current.subcategoryId,
    paymentMode || undefined,
  );

  const { data: selectedItemData } = useItemStats(
    selectedItemName,
    range.from,
    range.to,
    paymentMode || undefined,
  );

  const distribution = drilldownData?.data?.distribution ?? [];
  const timeSeries = drilldownData?.data?.timeSeries ?? [];
  const scopeSummary = buildScopeSummary(current, distribution);

  const filteredDistribution = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return distribution;

    return distribution.filter((item: any) =>
      String(item.name ?? 'Uncategorized').toLowerCase().includes(query),
    );
  }, [distribution, searchTerm]);

  const chartData = buildChartData(bucketPeriod, timeSeries, range.from, range.to);
  const pieData = distribution
    .filter((item: any) => Number(item.total ?? 0) > 0)
    .map((item: any) => ({
      name: item.name ?? 'Uncategorized',
      value: Math.round(Number(item.total ?? 0)),
    }));

  const selectedItemStats = selectedItemData?.data?.stats;
  const selectedItemRows = selectedItemData?.data?.recentItems ?? [];
  const selectedItemTrend = selectedItemData?.data?.monthlyBreakdown ?? [];

  const activeSummary =
    current.level === 'item' && selectedItemName && selectedItemStats
      ? {
          title: selectedItemName,
          total: selectedItemStats.totalSpent,
          qty: selectedItemStats.totalQuantity,
          count: selectedItemStats.purchaseCount,
          avgMetricLabel: 'Avg price / unit',
          avgMetricValue: selectedItemStats.avgUnitPrice,
        }
      : scopeSummary;

  const drillInto = (item: any) => {
    setSearchTerm('');
    setSelectedItemName('');

    if (current.level === 'category' && item.id) {
      setBreadcrumbs([
        ...breadcrumbs,
        {
          label: item.name ?? 'Unknown',
          level: 'subcategory',
          categoryId: item.id,
          summary: {
            total: Number(item.total ?? 0),
            qty: Number(item.qty ?? 0),
            count: Number(item.count ?? 0),
          },
        },
      ]);
      return;
    }

    if (current.level === 'subcategory' && item.id) {
      setBreadcrumbs([
        ...breadcrumbs,
        {
          label: item.name ?? 'Unknown',
          level: 'item',
          categoryId: current.categoryId,
          subcategoryId: item.id,
          summary: {
            total: Number(item.total ?? 0),
            qty: Number(item.qty ?? 0),
            count: Number(item.count ?? 0),
          },
        },
      ]);
      return;
    }

    if (current.level === 'item') {
      setSelectedItemName(item.name ?? '');
    }
  };

  const goTo = (index: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setSearchTerm('');
    setSelectedItemName('');
  };

  const goBack = () => {
    if (!canGoBack) return;
    setBreadcrumbs(breadcrumbs.slice(0, -1));
    setSearchTerm('');
    setSelectedItemName('');
  };

  const applyQuickRange = (value: QuickRange) => {
    setQuickRange(value);
    if (value === 'custom') return;

    const nextRange = getRangeFromPreset(value);
    setFrom(nextRange.from);
    setTo(nextRange.to);
  };

  const onChangeFrom = (value: string) => {
    setQuickRange('custom');
    setFrom(value);
  };

  const onChangeTo = (value: string) => {
    setQuickRange('custom');
    setTo(value);
  };

  const currentLevelLabel =
    current.level === 'category'
      ? 'Categories'
      : current.level === 'subcategory'
        ? 'Subcategories'
        : 'Items';
  const canDrillDeeper = current.level !== 'item';
  const showItemDetail = current.level === 'item' && selectedItemName && selectedItemStats;
  const xAxisInterval = bucketPeriod === 'monthly' ? 4 : 0;
  const isBarChart = bucketPeriod === 'daily' || bucketPeriod === 'weekly';

  return (
    <div className="space-y-5">
      <div className="card-elevated !p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <span className="section-badge">Analytics</span>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Explore spend from category to item
              </h1>
              <p className="max-w-2xl text-sm text-slate-500">
                Use one shared date range to drill into categories, subcategories, and item-level
                purchase patterns.
              </p>
            </div>

            <div className="rounded-[22px] bg-slate-50/80 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Current Range
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {range.from === range.to ? range.from : `${range.from} — ${range.to}`}
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem_14rem]">
            <div className="space-y-3">
              <div className="inline-flex flex-wrap rounded-full border border-slate-200/80 bg-white/80 p-1">
                {QUICK_RANGES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => applyQuickRange(item.value)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      quickRange === item.value
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => onChangeFrom(e.target.value)}
                    className="input-clean"
                    max={to}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    End date
                  </label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => onChangeTo(e.target.value)}
                    className="input-clean"
                    min={from}
                    max={getTodayDateValue()}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Lookup in {currentLevelLabel.toLowerCase()}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-clean"
                placeholder={getSearchPlaceholder(current.level)}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Payment mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="select-clean"
              >
                <option value="">All payment modes</option>
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card-elevated !p-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                {canGoBack ? (
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
                ) : null}

                <span className="rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                  {currentLevelLabel}
                </span>

                <p className="text-sm text-slate-500">
                  Viewing <span className="font-semibold text-slate-900">{current.label}</span>
                </p>
              </div>

              <div className="-mx-1 overflow-x-auto pb-1">
                <div className="flex min-w-max items-center gap-1 px-1 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={`${crumb.level}-${crumb.label}-${index}`} className="flex items-center gap-1">
                      {index > 0 ? <span className="text-gray-300">/</span> : null}
                      <button
                        type="button"
                        className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                          index === breadcrumbs.length - 1
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-gray-500 hover:bg-white hover:text-gray-700'
                        }`}
                        onClick={() => goTo(index)}
                      >
                        {crumb.label}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[20px] bg-slate-50/80 px-3 py-2 text-right">
              <p className="text-base font-bold text-slate-900 tabular-nums">
                {formatCurrency(activeSummary.total)}
              </p>
              <p className="text-[10px] text-slate-400">
                {showItemDetail ? 'Selected item' : 'Current scope'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Total spend
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(activeSummary.total)}
              </p>
            </div>

            <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Purchases
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{activeSummary.count}</p>
            </div>

            <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Total quantity
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {Math.round(activeSummary.qty * 100) / 100}
              </p>
            </div>

            <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {activeSummary.avgMetricLabel}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(activeSummary.avgMetricValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card-elevated h-64 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card-elevated lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Spend trend
              <span className="ml-1 font-normal text-gray-400">
                ({bucketPeriod === 'yearly' ? 'Monthly points' : 'Daily points'})
              </span>
            </h3>

            <div className="h-56">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  No data for this date range
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
                        formatter={(value: number) => formatCurrency(value)}
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
                        formatter={(value: number) => formatCurrency(value)}
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

          <div className="card-elevated">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Distribution</h3>
            <div className="h-44">
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
                      innerRadius={36}
                      outerRadius={68}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '10px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card-elevated overflow-x-auto !p-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {currentLevelLabel} breakdown
            </h3>
            <p className="text-xs text-slate-400">
              {filteredDistribution.length} shown
              {searchTerm.trim() ? ` for “${searchTerm.trim()}”` : ''}
            </p>
          </div>

          {current.level === 'item' ? (
            <p className="text-xs text-slate-400">Select an item row to inspect its detail.</p>
          ) : (
            <p className="text-xs text-slate-400">Click a row to drill deeper.</p>
          )}
        </div>

        {filteredDistribution.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No matches in this scope.
          </div>
        ) : (
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
                <th className="px-4 py-2.5 text-right">Purchases</th>
                <th className="px-4 py-2.5 text-right">Quantity</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-right">Avg</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistribution.map((item: any, index: number) => {
                const isSelected =
                  current.level === 'item' &&
                  selectedItemName &&
                  selectedItemName.toLowerCase() === String(item.name ?? '').toLowerCase();
                const averageValue =
                  current.level === 'item'
                    ? Number(item.avgPrice ?? 0)
                    : item.count > 0
                      ? Number(item.total ?? 0) / Number(item.count ?? 0)
                      : 0;

                return (
                  <tr
                    key={item.id ?? item.name ?? index}
                    className={`border-b border-gray-50 text-sm ${
                      canDrillDeeper || current.level === 'item'
                        ? 'cursor-pointer hover:bg-primary/5'
                        : 'hover:bg-gray-50/50'
                    } ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => drillInto(item)}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800">{item.name ?? 'Uncategorized'}</span>
                            {item.icon ? <span className="text-xs">{item.icon}</span> : null}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {current.level === 'category'
                              ? 'Open subcategories'
                              : current.level === 'subcategory'
                                ? 'Open items'
                                : 'Open item detail'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-gray-500">
                      {item.count}
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-gray-600">
                      {Math.round(Number(item.qty ?? 0) * 100) / 100}
                      {current.level === 'item' && item.unit ? ` ${item.unit}` : ''}
                    </td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums text-gray-900">
                      {formatCurrency(Number(item.total ?? 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-gray-500">
                      {formatCurrency(Math.round(averageValue * 100) / 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showItemDetail ? (
        <div className="card-elevated">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-badge">Item Detail</span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{selectedItemName}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Detailed performance for the selected item within the current date range.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Total spend
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(selectedItemStats.totalSpent)}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Total quantity
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {Math.round(selectedItemStats.totalQuantity * 100) / 100}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Purchases
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {selectedItemStats.purchaseCount}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/70 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Avg price / unit
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(selectedItemStats.avgUnitPrice)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="rounded-[24px] border border-white/70 bg-white/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Monthly spend trend</p>
                  <p className="text-xs text-slate-400">Helps surface price drift across time</p>
                </div>
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedItemTrend.map((item: any) => ({
                      name: item.month,
                      total: Math.round(Number(item.total ?? 0)),
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
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[24px] border border-white/70 bg-white/70">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItemRows.slice(0, 10).map((item: any, index: number) => (
                    <tr key={`${item.date}-${item.displayName}-${index}`} className="border-b border-slate-50 text-sm last:border-0">
                      <td className="px-4 py-3 text-xs text-slate-500">{item.date}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {item.categoryName ?? '-'}
                        {item.subcategoryName ? ` / ${item.subcategoryName}` : ''}
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-600">
                        {item.quantity}
                        {item.unit ? ` ${item.unit}` : ''}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {canGoBack && previousCrumb ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-[60] flex justify-center px-4 lg:hidden">
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
      ) : null}
    </div>
  );
}
