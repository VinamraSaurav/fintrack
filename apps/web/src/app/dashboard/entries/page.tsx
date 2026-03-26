'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExpenses, useDeleteExpense } from '@/hooks/use-expenses';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

export default function EntriesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useExpenses({ page: String(page), limit: '20', sort: 'date_desc' });
  const deleteExpense = useDeleteExpense();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const expenses = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entries</h1>
          <p className="text-xs text-gray-500">View, edit, or delete your expense entries</p>
        </div>
        <Link href="/dashboard/expenses/new" className="btn btn-primary btn-sm gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Entry
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card-elevated h-20 animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="card-elevated py-16 text-center">
          <p className="text-gray-400">No entries yet</p>
          <Link href="/dashboard/expenses/new" className="btn btn-primary btn-sm mt-4">Create your first entry</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="card-elevated !p-0 overflow-hidden">
              {/* Entry header */}
              <div className="flex items-center gap-4 border-b border-gray-50 bg-gray-50/50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {expense.title ?? `Entry — ${formatDate(expense.expenseDate)}`}
                    </h3>
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {expense.items.length} item{expense.items.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(expense.expenseDate)}
                    {expense.note && <> &middot; {expense.note}</>}
                  </p>
                </div>
                <p className="text-base font-bold text-gray-900 tabular-nums">
                  {formatCurrency(expense.totalAmount, expense.currency)}
                </p>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/expenses/new?edit=${expense.id}`}
                    className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </Link>
                  <button
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete"
                    onClick={() => setDeleteTarget(expense.id)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Items table */}
              <table className="w-full text-left">
                <tbody>
                  {expense.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0 text-sm">
                      <td className="px-4 py-2 text-gray-900">{item.displayName}</td>
                      <td className="px-4 py-2 text-xs text-gray-400">{item.categoryName ?? '-'}</td>
                      <td className="px-4 py-2 text-xs text-gray-400">{item.subcategoryName ?? '-'}</td>
                      <td className="px-4 py-2 text-xs text-gray-500 text-right tabular-nums">
                        {item.quantity} {item.unit ?? ''}
                      </td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn btn-ghost btn-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span className="text-xs text-gray-500">{pagination.page} / {pagination.totalPages}</span>
          <button className="btn btn-ghost btn-xs" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete entry?"
        message="This will permanently delete this entry and all its items."
        confirmLabel="Delete"
        isLoading={deleteExpense.isPending}
        onConfirm={() => { if (deleteTarget) deleteExpense.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) }); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
