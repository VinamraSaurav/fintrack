'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-expenses';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

const EMOJI_PRESETS = ['🛒', '🍕', '🚗', '💡', '🏥', '🛍️', '🎬', '📚', '📦', '💼', '🏠', '✈️', '🎮', '👶', '🐾', '💅', '🏋️', '🎁', '☕', '🧹', '💰', '🎯', '🛠️', '🌿'];

export default function CategoriesPage() {
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#6366f1');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'category' | 'subcategory'; linkedCount?: number; linkedMessage?: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Expanded categories
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Add subcategory
  const [addSubFor, setAddSubFor] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const allCategories = data?.data ?? [];
  const defaultCats = allCategories.filter((c: any) => c.isDefault);
  const customCats = allCategories.filter((c: any) => !c.isDefault);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCategory.mutateAsync({ name: name.trim(), icon, color });
    setName('');
    setIcon('📦');
  };

  const handleAddSub = async (categoryId: string) => {
    if (!newSubName.trim()) return;
    const token = await getToken();
    await apiClient(`/api/categories/${categoryId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify({ name: newSubName.trim() }),
      token: token ?? undefined,
    });
    setNewSubName('');
    setAddSubFor(null);
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const attemptDelete = async (id: string, type: 'category' | 'subcategory', name: string) => {
    const token = await getToken();
    const url = type === 'category'
      ? `/api/categories/${id}`
      : `/api/categories/subcategories/${id}`;

    try {
      await apiClient(url, { method: 'DELETE', token: token ?? undefined });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
      setDeleteConfirmText('');
    } catch (err: any) {
      // Check if it's a 409 with linked items
      if (err.status === 409) {
        const msg = err.message || 'Items are linked to this. They will become uncategorized.';
        setDeleteTarget({ id, name, type, linkedCount: 1, linkedMessage: msg });
      }
    }
  };

  const forceDelete = async () => {
    if (!deleteTarget || deleteConfirmText !== 'delete') return;
    const token = await getToken();
    const url = deleteTarget.type === 'category'
      ? `/api/categories/${deleteTarget.id}?force=true`
      : `/api/categories/subcategories/${deleteTarget.id}?force=true`;

    await apiClient(url, { method: 'DELETE', token: token ?? undefined });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setDeleteTarget(null);
    setDeleteConfirmText('');
  };

  const usedColors = allCategories.map((c: any) => c.color).filter(Boolean);

  const renderCategory = (cat: any, editable: boolean) => {
    const isExpanded = expanded.has(cat.id);
    const subs = cat.subcategories ?? [];

    return (
      <div key={cat.id} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        {/* Category header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleExpand(cat.id)}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
            style={{ backgroundColor: `${cat.color ?? '#6b7280'}20` }}
          >
            {cat.icon}
          </div>
          <div
            className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: cat.color ?? '#6b7280' }}
          />
          <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
          <span className="text-[10px] text-gray-400">{subs.length} sub</span>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {editable && (
            <button
              className="ml-1 text-gray-300 hover:text-red-500 transition-colors"
              onClick={(e) => { e.stopPropagation(); attemptDelete(cat.id, 'category', cat.name); }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Subcategories */}
        {isExpanded && (
          <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-2">
            {subs.length === 0 ? (
              <p className="py-2 text-xs text-gray-400">No subcategories</p>
            ) : (
              <div className="space-y-1">
                {subs.map((sub: any) => (
                  <div key={sub.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    <span className="flex-1 text-xs text-gray-600">{sub.name}</span>
                    <button
                      className="text-gray-300 hover:text-red-500"
                      onClick={() => attemptDelete(sub.id, 'subcategory', sub.name)}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add subcategory */}
            {addSubFor === cat.id ? (
              <div className="mt-2 flex gap-2">
                <input
                  className="input-clean flex-1 text-xs"
                  placeholder="Subcategory name"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSub(cat.id)}
                  autoFocus
                />
                <button className="btn btn-primary btn-xs" onClick={() => handleAddSub(cat.id)}>Add</button>
                <button className="btn btn-ghost btn-xs" onClick={() => { setAddSubFor(null); setNewSubName(''); }}>Cancel</button>
              </div>
            ) : (
              <button
                className="mt-1 text-[11px] font-medium text-primary hover:underline"
                onClick={() => setAddSubFor(cat.id)}
              >
                + Add subcategory
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Categories</h1>

      {/* Create new */}
      <form onSubmit={handleCreate} className="card-elevated space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">New Category</h2>
        <div className="flex gap-3">
          <div className="relative">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-lg hover:bg-gray-50"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {icon}
            </button>
            {showEmojiPicker && (
              <div className="absolute left-0 top-12 z-50 grid w-60 grid-cols-6 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                {EMOJI_PRESETS.map((e) => (
                  <button
                    key={e} type="button"
                    className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
                    onClick={() => { setIcon(e); setShowEmojiPicker(false); }}
                  >{e}</button>
                ))}
              </div>
            )}
          </div>
          <input type="text" className="input-clean flex-1" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />

          {/* Color picker with used colors shown */}
          <div className="flex flex-col items-center gap-1">
            <input type="color" className="h-8 w-8 cursor-pointer rounded border-0" value={color} onChange={(e) => setColor(e.target.value)} />
            <div className="flex gap-0.5">
              {usedColors.slice(0, 6).map((c: string, i: number) => (
                <span key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-sm" disabled={!name.trim() || createCategory.isPending}>
            {createCategory.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Add'}
          </button>
        </div>
        <p className="text-[10px] text-gray-400">Colors already in use are shown below the picker so you can choose a unique one.</p>
      </form>

      {/* Custom categories */}
      {customCats.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">Your Categories</h2>
          {customCats.map((cat: any) => renderCategory(cat, true))}
        </div>
      )}

      {/* Default categories */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900">Default Categories</h2>
        <p className="text-xs text-gray-400">Built-in categories. You can add subcategories to these.</p>
        {defaultCats.map((cat: any) => renderCategory(cat, false))}
      </div>

      {/* Delete Dialog */}
      {deleteTarget && (
        <dialog className="modal modal-open" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}>
          <div className="modal-box max-w-sm bg-white" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900">
              Delete {deleteTarget.type === 'category' ? 'category' : 'subcategory'}?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently remove <strong>{deleteTarget.name}</strong>.
              {deleteTarget.linkedMessage ? (
                <span className="mt-2 block rounded bg-red-50 p-2 text-xs text-red-700">
                  {deleteTarget.linkedMessage}
                </span>
              ) : null}
            </p>

            {deleteTarget.linkedCount ? (
              <div className="mt-3">
                <label className="text-xs text-gray-500">Type <strong>delete</strong> to confirm:</label>
                <input
                  className="input-clean mt-1"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete"
                  autoFocus
                />
              </div>
            ) : null}

            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}>
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm"
                disabled={deleteConfirmText !== 'delete'}
                onClick={forceDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
