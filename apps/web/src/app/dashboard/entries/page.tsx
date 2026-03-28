'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { ExpenseResponse } from '@fintrack/shared';
import { useExpenses, useDeleteExpense } from '@/hooks/use-expenses';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 300;

function EntryViewDialog({
  expense,
  open,
  onClose,
}: {
  expense: ExpenseResponse | null;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialogRef.current) return;

    if (open && expense) {
      dialogRef.current.showModal();
      return;
    }

    dialogRef.current.close();
  }, [expense, open]);

  if (!expense) return null;

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg overflow-hidden bg-white !p-0">
        <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-gray-900">
                  {expense.title ?? `Entry — ${formatDate(expense.expenseDate)}`}
                </h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-500">
                  {expense.items.length} item{expense.items.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {formatDate(expense.expenseDate)} · {formatRelativeDate(expense.expenseDate)}
              </p>
              {expense.note ? (
                <p className="mt-2 text-sm text-gray-500">{expense.note}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-lg font-bold tabular-nums text-gray-900">
              {formatCurrency(expense.totalAmount, expense.currency)}
            </p>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          {expense.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-3"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.displayName}</p>
                  {item.note ? (
                    <p className="mt-0.5 text-xs text-gray-400">{item.note}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                  {formatCurrency(item.amount, expense.currency)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                <span>
                  {item.quantity} {item.unit ?? 'unit'}
                </span>
                <span>{item.paymentMode ?? 'No payment mode'}</span>
                <span>{item.categoryName ?? 'Uncategorized'}</span>
                {item.subcategoryName ? <span>{item.subcategoryName}</span> : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
          <Link href={`/dashboard/expenses/new?edit=${expense.id}`} className="btn btn-primary btn-sm">
            Edit Entry
          </Link>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

export default function EntriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<ExpenseResponse | null>(null);

  const deleteExpense = useDeleteExpense();
  const hasFilters = Boolean(search.trim() || dateFrom || dateTo);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo]);

  useEffect(() => {
    if (dateFrom || dateTo) {
      setMobileFiltersOpen(true);
    }
  }, [dateFrom, dateTo]);

  const queryParams = useMemo(
    () => ({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort: 'date_desc',
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      ...(dateFrom ? { from: dateFrom } : {}),
      ...(dateTo ? { to: dateTo } : {}),
    }),
    [page, debouncedSearch, dateFrom, dateTo],
  );

  const { data, isLoading, isFetching } = useExpenses(queryParams);
  const expenses = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const totalResults = pagination?.total ?? 0;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const currentRangeLabel =
    totalResults > 0
      ? `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, totalResults)} of ${totalResults}`
      : '0 results';

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entries</h1>
          <p className="text-xs text-gray-500">
            Search, review, or manage your saved expense entries
          </p>
        </div>
        <Link href="/dashboard/expenses/new" className="btn btn-primary btn-sm gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Entry
        </Link>
      </div>

      <div className="card-elevated space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="hidden text-xs text-gray-500 md:block">
            Search runs across full history now and stays paginated by the API.
          </p>
          <p className="hidden text-xs text-gray-400 md:block">
            {isFetching && !isLoading ? 'Updating...' : currentRangeLabel}
          </p>
        </div>

        <div className="space-y-3 md:hidden">
          <label className="relative block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400">
              Search
            </span>
            <svg
              className="pointer-events-none absolute left-3 top-[2.15rem] h-4 w-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-clean w-full pl-9"
              placeholder="Search title, note, or item"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
              onClick={() => setMobileFiltersOpen((current) => !current)}
            >
              {mobileFiltersOpen ? 'Hide dates' : 'Date filters'}
            </button>
            <p className="text-[11px] text-gray-400">
              {isFetching && !isLoading ? 'Updating...' : currentRangeLabel}
            </p>
          </div>

          {mobileFiltersOpen ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400">
                  From
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="input-clean w-full text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400">
                  To
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="input-clean w-full text-base"
                />
              </label>

              <button
                type="button"
                className="btn btn-ghost btn-sm col-span-2 border border-gray-200"
                onClick={() => {
                  setSearch('');
                  setDateFrom('');
                  setDateTo('');
                  setMobileFiltersOpen(false);
                }}
                disabled={!hasFilters}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        <div className="hidden grid-cols-1 gap-3 md:grid md:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]">
          <label className="relative block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400">
              Search
            </span>
            <svg
              className="pointer-events-none absolute left-3 top-[2.15rem] h-4 w-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-clean w-full pl-9"
              placeholder="Search title, note, or item"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400">
              From
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="input-clean w-full text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400">
              To
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="input-clean w-full text-sm"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-ghost btn-sm w-full border border-gray-200 md:w-auto"
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
              }}
              disabled={!hasFilters}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card-elevated h-36 animate-pulse" />
          ))}
        </div>
      ) : totalResults === 0 && !hasFilters ? (
        <div className="card-elevated py-16 text-center">
          <p className="text-gray-400">No entries yet</p>
          <Link href="/dashboard/expenses/new" className="btn btn-primary btn-sm mt-4">
            Create your first entry
          </Link>
        </div>
      ) : totalResults === 0 ? (
        <div className="card-elevated py-16 text-center">
          <p className="text-gray-400">No entries match the current search or date range</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const previewItems = expense.items.slice(0, 2);
            const remainingItems = expense.items.length - previewItems.length;

            return (
              <div key={expense.id} className="card-elevated space-y-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-gray-900">
                        {expense.title ?? `Entry — ${formatDate(expense.expenseDate)}`}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                        {expense.items.length} item{expense.items.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(expense.expenseDate)} · {formatRelativeDate(expense.expenseDate)}
                    </p>
                    {expense.note ? (
                      <p className="mt-1 truncate text-xs text-gray-500">{expense.note}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-base font-bold tabular-nums text-gray-900">
                      {formatCurrency(expense.totalAmount, expense.currency)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:border-primary/30 hover:text-primary"
                        onClick={() => setViewTarget(expense)}
                      >
                        View
                      </button>
                      <Link
                        href={`/dashboard/expenses/new?edit=${expense.id}`}
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </Link>
                      <button
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                        onClick={() => setDeleteTarget(expense.id)}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {previewItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl bg-gray-50/80 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{item.displayName}</p>
                        <p className="truncate text-[11px] text-gray-400">
                          {item.quantity} {item.unit ?? 'unit'} · {item.categoryName ?? 'Uncategorized'}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                        {formatCurrency(item.amount, expense.currency)}
                      </p>
                    </div>
                  ))}

                  {remainingItems > 0 ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary transition hover:text-primary/80"
                      onClick={() => setViewTarget(expense)}
                    >
                      + {remainingItems} more item{remainingItems > 1 ? 's' : ''} in View
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn btn-ghost btn-xs"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((current) => current - 1)}
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {page} / {totalPages}
          </span>
          <button
            className="btn btn-ghost btn-xs"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      <EntryViewDialog
        expense={viewTarget}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete entry?"
        message="This will permanently delete this entry and all its items."
        confirmLabel="Delete"
        isLoading={deleteExpense.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteExpense.mutate(deleteTarget, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
