'use client';

import { useState } from 'react';
import { useIncomes, useCreateIncome, useDeleteIncome } from '@/hooks/use-expenses';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

const SOURCES = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Gift', 'Refund', 'Other'];

export default function IncomePage() {
  const { data, isLoading } = useIncomes();
  const createIncome = useCreateIncome();
  const deleteIncome = useDeleteIncome();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');

  const incomes = data?.data ?? [];
  const totalIncome = incomes.reduce((sum: number, i: any) => sum + i.amount, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    await createIncome.mutateAsync({
      title: title.trim(),
      amount: parseFloat(amount),
      income_date: date,
      source: source || undefined,
      note: note || undefined,
    });
    setTitle('');
    setAmount('');
    setNote('');
    setShowForm(false);
  };

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Income</h1>
          <p className="text-sm text-gray-500">Track your earnings</p>
        </div>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowForm(!showForm)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Income
        </button>
      </div>

      {/* Total */}
      <div className="stat-card bg-emerald-50">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Income (visible)</p>
        <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
        <p className="text-xs text-gray-400">{incomes.length} entries</p>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card-elevated space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">New Income</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className="input-clean" placeholder="Title (e.g. March Salary)" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <input type="number" step="0.01" className="input-clean" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <input type="date" className="input-clean" value={date} onChange={(e) => setDate(e.target.value)} required />
            <select className="select-clean" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">Source (optional)</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <input className="input-clean" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={createIncome.isPending}>
              {createIncome.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Save'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card-elevated h-16 animate-pulse" />)}</div>
      ) : incomes.length === 0 ? (
        <div className="card-elevated py-12 text-center">
          <p className="text-gray-400">No income recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {incomes.map((income: any) => (
            <div key={income.id} className="card-elevated flex items-center gap-4 !p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base">
                💰
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{income.title}</p>
                <p className="text-xs text-gray-400">
                  {formatDate(income.incomeDate)}
                  {income.source && <> &middot; {income.source}</>}
                </p>
              </div>
              <p className="text-sm font-bold text-emerald-600">
                +{formatCurrency(income.amount)}
              </p>
              <button
                className="text-xs text-gray-400 hover:text-red-500"
                onClick={() => setDeleteTarget(income.id)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete income?"
        message="This income entry will be permanently removed."
        onConfirm={() => { if (deleteTarget) deleteIncome.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) }); }}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteIncome.isPending}
      />
    </div>
  );
}
