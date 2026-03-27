'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExpenses, useCategories } from '@/hooks/use-expenses';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportCSV, exportXLSX, exportPDF } from '@/lib/export';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import type { ExpenseResponse, PaginatedResponse } from '@fintrack/shared';

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('date_desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const params: Record<string, string> = { page: String(page), limit: '50', sort };
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;
  if (minAmount) params.min_amount = minAmount;
  if (maxAmount) params.max_amount = maxAmount;

  const { data, isLoading } = useExpenses(params);
  const { data: categoriesData } = useCategories();
  const { getToken } = useAuth();
  const [exporting, setExporting] = useState(false);
  const expenses = data?.data ?? [];
  const pagination = data?.pagination;
  const categories = categoriesData?.data ?? [];

  // Flatten items with client-side filters applied
  const searchLower = itemSearch.toLowerCase();
  const allItems = expenses.flatMap((exp) =>
    exp.items
      .filter((item) => !categoryFilter || item.categoryId === categoryFilter)
      .filter(
        (item) =>
          !itemSearch ||
          item.displayName.toLowerCase().includes(searchLower) ||
          item.rawName.toLowerCase().includes(searchLower),
      )
      .map((item) => ({
        ...item,
        expenseId: exp.id,
        expenseDate: exp.expenseDate,
        currency: exp.currency,
      })),
  );

  const totalFiltered = allItems.reduce((s, i) => s + i.amount, 0);

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(true);
    try {
      const needsFetch = pagination && pagination.totalPages > 1;
      let exportExpenses = expenses;

      if (needsFetch) {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        const exportParams = new URLSearchParams({ limit: '5000', sort });
        if (dateFrom) exportParams.set('from', dateFrom);
        if (dateTo) exportParams.set('to', dateTo);
        if (minAmount) exportParams.set('min_amount', minAmount);
        if (maxAmount) exportParams.set('max_amount', maxAmount);
        const allData = await apiClient<PaginatedResponse<ExpenseResponse>>(
          `/api/expenses?${exportParams.toString()}`,
          { token },
        );
        exportExpenses = allData.data;
      }

      const visibleExpenses = filterExpensesForExport(exportExpenses, categoryFilter, itemSearch);
      const opts = { dateFrom, dateTo };
      if (format === 'csv') exportCSV(visibleExpenses, opts);
      else if (format === 'xlsx') await exportXLSX(visibleExpenses, opts);
      else if (format === 'pdf') await exportPDF(visibleExpenses, opts);
    } catch (err: any) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-container space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
          <p className="text-xs text-gray-500">Filter and explore your spending data</p>
        </div>
        <Link href="/dashboard/entries" className="btn btn-ghost btn-sm border border-gray-200">
          Manage Entries
        </Link>
      </div>

      {/* Filters */}
      <div className="card-elevated relative z-20 !p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              From
            </label>
            <input
              type="date"
              className="input-clean w-auto text-xs"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">To</label>
            <input
              type="date"
              className="input-clean w-auto text-xs"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              Category
            </label>
            <select
              className="select-clean w-auto text-xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              Item Search
            </label>
            <input
              type="text"
              className="input-clean w-32 text-xs"
              placeholder="e.g. potato"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              Min Amount
            </label>
            <input
              type="number"
              className="input-clean w-24 text-xs"
              placeholder="0"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              Max Amount
            </label>
            <input
              type="number"
              className="input-clean w-24 text-xs"
              placeholder="Any"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
              Sort
            </label>
            <select
              className="select-clean w-auto text-xs"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="date_desc">Newest</option>
              <option value="date_asc">Oldest</option>
              <option value="amount_desc">Highest</option>
              <option value="amount_asc">Lowest</option>
            </select>
          </div>
          <div className="ml-auto">
            <div className="dropdown dropdown-end z-30">
              <label
                tabIndex={0}
                className="btn btn-ghost btn-sm border border-gray-200 gap-1.5 text-xs"
              >
                {exporting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                )}
                Export
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu rounded-lg border border-gray-200 bg-white p-1 shadow-lg z-50 w-36"
              >
                <li>
                  <button onClick={() => handleExport('csv')} className="text-xs">
                    CSV
                  </button>
                </li>
                <li>
                  <button onClick={() => handleExport('xlsx')} className="text-xs">
                    Excel
                  </button>
                </li>
                <li>
                  <button onClick={() => handleExport('pdf')} className="text-xs">
                    PDF
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card-elevated animate-pulse space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 rounded bg-gray-50" />
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <div className="card-elevated py-16 text-center">
          <p className="text-gray-400">No items found matching filters</p>
        </div>
      ) : (
        <div className="card-elevated relative z-0 overflow-x-auto !p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Item</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Subcategory</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5">Unit</th>
                <th className="px-3 py-2.5 text-right">Price/Unit</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item) => (
                <tr
                  key={`${item.expenseId}-${item.id}`}
                  className="border-b border-gray-50 text-sm hover:bg-gray-50/50"
                >
                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(item.expenseDate)}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">{item.displayName}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{item.categoryName ?? '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">{item.subcategoryName ?? '-'}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">{item.unit ?? '-'}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-gray-500">
                    {item.unitPrice
                      ? formatCurrency(item.unitPrice, item.currency)
                      : item.quantity > 0
                        ? formatCurrency(item.amount / item.quantity, item.currency)
                        : '-'}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900">
                    {formatCurrency(item.amount, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td colSpan={7} className="px-3 py-2 text-xs font-medium text-gray-500">
                  {allItems.length} items
                </td>
                <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-gray-900">
                  {formatCurrency(totalFiltered)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn btn-ghost btn-xs"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn btn-ghost btn-xs"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function filterExpensesForExport(
  expenses: ExpenseResponse[],
  categoryFilter: string,
  itemSearch: string,
): ExpenseResponse[] {
  const searchLower = itemSearch.trim().toLowerCase();

  return expenses
    .map((expense) => {
      const items = expense.items.filter((item) => {
        if (categoryFilter && item.categoryId !== categoryFilter) return false;
        if (!searchLower) return true;

        return (
          item.displayName.toLowerCase().includes(searchLower) ||
          item.rawName.toLowerCase().includes(searchLower)
        );
      });

      return {
        ...expense,
        items,
        totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      };
    })
    .filter((expense) => expense.items.length > 0);
}
