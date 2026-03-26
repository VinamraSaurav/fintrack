'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExpenseSchema, type CreateExpenseInput } from '@fintrack/shared';
import { useCreateExpense, useCategories } from '@/hooks/use-expenses';

export default function NewExpensePage() {
  const router = useRouter();
  const createExpense = useCreateExpense();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      expense_date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
      currency: 'INR',
      is_group: false,
      items: [{ raw_name: '', amount: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' });

  const handleScanBill = async (file: File) => {
    setScanning(true);
    setScanError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('categories', JSON.stringify(categories));

      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Scan failed');

      const scannedItems = json.data?.items ?? [];
      if (scannedItems.length === 0) {
        setScanError('No items could be extracted. Please enter manually.');
        return;
      }

      // Map scanned items to form format and append to existing items
      const newItems = scannedItems.map((item: any) => {
        // Find matching category
        const matchedCat = categories.find((c: any) =>
          c.name.toLowerCase() === item.category?.toLowerCase(),
        );
        const matchedSub = matchedCat?.subcategories?.find((s: any) =>
          s.name.toLowerCase() === item.subcategory?.toLowerCase(),
        );

        return {
          raw_name: item.name,
          quantity: item.quantity ?? 1,
          unit: item.unit ?? undefined,
          amount: item.amount ?? 0,
          category_id: matchedCat?.id ?? undefined,
          subcategory_id: matchedSub?.id ?? undefined,
        };
      });

      // Remove empty default items and append scanned ones
      const currentItems = getValues('items');
      const hasContent = currentItems.some((i) => i.raw_name.trim() !== '');
      if (hasContent) {
        // Append to existing
        newItems.forEach((item: any) => append(item));
      } else {
        // Replace empty defaults
        replace(newItems);
      }

      // Set title and date from scan if available
      if (json.data?.store_name) {
        setValue('title', json.data.store_name);
      }
      if (json.data?.bill_date) {
        setValue('expense_date', json.data.bill_date);
      }
    } catch (err: any) {
      setScanError(err.message || 'Bill scan failed. Please enter manually or try again.');
    } finally {
      setScanning(false);
    }
  };

  const onSubmit = async (data: CreateExpenseInput) => {
    // Auto-calculate unit_price for each item
    const processed = {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        unit_price: item.quantity > 0 ? item.amount / item.quantity : undefined,
      })),
    };
    try {
      await createExpense.mutateAsync(processed);
      router.push('/dashboard/expenses');
    } catch {}
  };

  return (
    <div className="page-container max-w-2xl">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="mb-6 text-xl font-bold text-gray-900">Add Expense</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Info */}
        <div className="card-elevated space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Title (optional)</label>
              <input {...register('title')} className="input-clean" placeholder="Weekly groceries" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Date</label>
              <input type="date" {...register('expense_date')} className="input-clean" />
              {errors.expense_date && <p className="mt-1 text-xs text-red-500">{errors.expense_date.message}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Note</label>
            <textarea {...register('note')} className="input-clean" rows={2} placeholder="Optional notes..." />
          </div>
        </div>

        {/* Bill Scan */}
        <div className="card-elevated bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Scan a bill</p>
              <p className="text-xs text-gray-500">Upload a photo and AI will extract items automatically</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleScanBill(file);
              }}
            />
            <button
              type="button"
              className="btn btn-sm border border-primary/30 bg-white text-primary hover:bg-primary/5"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
            >
              {scanning ? (
                <><span className="loading loading-spinner loading-xs" /> Scanning...</>
              ) : (
                'Upload Bill'
              )}
            </button>
          </div>
          {scanError && (
            <p className="mt-2 text-xs text-red-500">{scanError}</p>
          )}
        </div>

        {/* Items */}
        <div className="card-elevated space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Items</h2>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => append({ raw_name: '', amount: 0, quantity: 1 })}
            >
              + Add item
            </button>
          </div>

          {fields.map((field, index) => {
            const selectedCatId = watchedItems?.[index]?.category_id;
            const selectedCat = categories.find((c: any) => c.id === selectedCatId);
            const subs = (selectedCat as any)?.subcategories ?? [];
            const qty = watchedItems?.[index]?.quantity ?? 1;
            const amount = watchedItems?.[index]?.amount ?? 0;
            const unitPrice = qty > 0 && amount > 0 ? (amount / qty).toFixed(2) : '-';

            return (
              <div key={field.id} className="relative rounded-lg border border-gray-100 bg-gray-50 p-3">
                {/* Delete button — top right */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    onClick={() => remove(index)}
                    title="Remove item"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Row 1: Category → Subcategory → Name */}
                <div className="mb-2 grid grid-cols-12 gap-2 pr-8">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Category</label>
                    <select {...register(`items.${index}.category_id`)} className="select-clean text-sm">
                      <option value="">Select category</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Subcategory</label>
                    <select {...register(`items.${index}.subcategory_id`)} className="select-clean text-sm" disabled={!selectedCatId}>
                      <option value="">{selectedCatId ? 'Select' : 'Pick category first'}</option>
                      {subs.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-6 sm:col-span-5">
                    <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Item Name</label>
                    <input
                      {...register(`items.${index}.raw_name`)}
                      className="input-clean text-sm"
                      placeholder={selectedCatId ? 'e.g. specific item name' : 'e.g. aloo, potato, milk'}
                    />
                    {errors.items?.[index]?.raw_name && (
                      <p className="mt-0.5 text-xs text-red-500">{errors.items[index].raw_name?.message}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Qty + Unit + Amount + Unit Price (calculated) */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Qty</label>
                    <input
                      type="number" step="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className="input-clean text-sm" placeholder="1"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Unit</label>
                    <select {...register(`items.${index}.unit`)} className="select-clean text-sm">
                      <option value="">-</option>
                      <optgroup label="Weight">
                        <option value="kg">kg</option><option value="g">g</option>
                      </optgroup>
                      <optgroup label="Volume">
                        <option value="L">L</option><option value="ml">ml</option>
                      </optgroup>
                      <optgroup label="Count">
                        <option value="pcs">pcs</option><option value="dozen">dozen</option>
                        <option value="pack">pack</option><option value="box">box</option>
                        <option value="bag">bag</option><option value="pair">pair</option>
                      </optgroup>
                      <optgroup label="Serving">
                        <option value="plate">plate</option><option value="serving">serving</option>
                        <option value="cup">cup</option><option value="slice">slice</option>
                      </optgroup>
                      <optgroup label="Container">
                        <option value="bottle">bottle</option><option value="can">can</option>
                        <option value="jar">jar</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="kWh">kWh</option><option value="trip">trip</option>
                        <option value="month">month</option><option value="meter">meter</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Total Amount</label>
                    <input
                      type="number" step="0.01"
                      {...register(`items.${index}.amount`, { valueAsNumber: true })}
                      className="input-clean text-sm" placeholder="0"
                    />
                    {errors.items?.[index]?.amount && (
                      <p className="mt-0.5 text-xs text-red-500">{errors.items[index].amount?.message}</p>
                    )}
                  </div>
                  <div className="col-span-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Price/Unit</label>
                    <div className="flex h-[38px] items-center rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500">
                      {unitPrice}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary btn-sm" disabled={createExpense.isPending}>
            {createExpense.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Save Expense'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.back()}>Cancel</button>
        </div>

        {createExpense.isError && (
          <p className="text-sm text-red-500">Failed to save. Please try again.</p>
        )}
      </form>
    </div>
  );
}
