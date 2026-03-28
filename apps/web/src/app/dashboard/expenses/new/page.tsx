'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createExpenseSchema,
  type CreateExpenseInput,
  type ExpenseResponse,
  PAYMENT_MODES,
  type Unit,
  type UpdateExpenseInput,
} from '@fintrack/shared';
import {
  useCreateExpense,
  useCategories,
  useExpense,
  useUpdateExpense,
} from '@/hooks/use-expenses';
import { getTodayDateValue } from '@/lib/utils';

const DEFAULT_PAYMENT_MODE = PAYMENT_MODES[1];
const itemLabelClass =
  'mb-1 block min-h-[12px] text-[10px] font-medium uppercase leading-3 text-gray-400';

function FieldError({ message }: { message?: string }) {
  return (
    <p
      className={`mt-1 min-h-[1rem] text-[11px] leading-4 ${
        message ? 'text-red-500' : 'text-transparent'
      }`}
    >
      {message ?? '\u00A0'}
    </p>
  );
}

function getFieldClass(baseClass: string, hasError?: boolean) {
  return hasError
    ? `${baseClass} border-red-200 bg-red-50/40 focus:border-red-300 focus:ring-red-100`
    : baseClass;
}

function getDefaultExpenseValues(): CreateExpenseInput {
  return {
    expense_date: getTodayDateValue(),
    currency: 'INR',
    is_group: false,
    items: [{ raw_name: '', amount: 0, quantity: 1, payment_mode: DEFAULT_PAYMENT_MODE }],
  };
}

function normalizeUnit(unit: string | null | undefined): Unit | undefined {
  return unit && unit !== 'NA' ? (unit as Unit) : undefined;
}

function mapExpenseToFormValues(expense: ExpenseResponse): CreateExpenseInput {
  return {
    title: expense.title ?? undefined,
    expense_date: expense.expenseDate,
    currency: expense.currency as CreateExpenseInput['currency'],
    note: expense.note ?? undefined,
    is_group: expense.isGroup,
    items:
      expense.items.length > 0
        ? expense.items.map((item) => ({
            raw_name: item.rawName,
            quantity: item.quantity ?? 1,
            unit: normalizeUnit(item.unit),
            unit_price: item.unitPrice ?? undefined,
            amount: item.amount,
            payment_mode:
              (item.paymentMode as CreateExpenseInput['items'][number]['payment_mode']) ??
              DEFAULT_PAYMENT_MODE,
            category_id: item.categoryId ?? undefined,
            subcategory_id: item.subcategoryId ?? undefined,
          }))
        : getDefaultExpenseValues().items,
  };
}

function NewExpensePageFallback() {
  return (
    <div className="page-container max-w-2xl space-y-4">
      <div className="h-6 w-28 animate-pulse rounded bg-gray-100" />
      <div className="card-elevated h-32 animate-pulse" />
      <div className="card-elevated h-24 animate-pulse" />
      <div className="card-elevated h-72 animate-pulse" />
    </div>
  );
}

function NewExpensePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') ?? '';
  const isEditMode = Boolean(editId);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const {
    data: expenseData,
    isLoading: isExpenseLoading,
    isError: isExpenseError,
  } = useExpense(editId);
  const expense = expenseData?.data;
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
    setError,
    clearErrors,
    getValues,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: getDefaultExpenseValues(),
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' });

  const getPreferredPaymentMode = () => {
    const items = getValues('items');
    return items[items.length - 1]?.payment_mode ?? DEFAULT_PAYMENT_MODE;
  };

  useEffect(() => {
    if (!expense) return;
    const formValues = mapExpenseToFormValues(expense);
    reset(formValues);
    replace(formValues.items);
  }, [expense, replace, reset]);

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
        const matchedCat = categories.find(
          (c: any) => c.name.toLowerCase() === item.category?.toLowerCase(),
        );
        const matchedSub = matchedCat?.subcategories?.find(
          (s: any) => s.name.toLowerCase() === item.subcategory?.toLowerCase(),
        );

        return {
          raw_name: item.name,
          quantity: item.quantity ?? 1,
          unit: normalizeUnit(item.unit),
          amount: item.amount ?? 0,
          payment_mode: getPreferredPaymentMode(),
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

  const getSelectionErrorPaths = (index: number) =>
    [`items.${index}.category_id`, `items.${index}.subcategory_id`] as const;

  const validateItemSelections = (items: CreateExpenseInput['items']) => {
    let hasError = false;

    items.forEach((item, index) => {
      clearErrors(getSelectionErrorPaths(index));
      const selectedCategory = categories.find((category: any) => category.id === item.category_id);
      const hasSubcategories = (selectedCategory?.subcategories?.length ?? 0) > 0;

      if (!item.category_id) {
        setError(`items.${index}.category_id`, {
          type: 'manual',
          message: 'Pick category',
        });
        hasError = true;
      }

      if (item.category_id && hasSubcategories && !item.subcategory_id) {
        setError(`items.${index}.subcategory_id`, {
          type: 'manual',
          message: 'Pick subcategory',
        });
        hasError = true;
      }
    });

    return !hasError;
  };

  const onSubmit = async (data: CreateExpenseInput) => {
    if (!validateItemSelections(data.items)) return;

    const processedItems = data.items.map((item) => ({
      ...item,
      unit: normalizeUnit(item.unit),
      unit_price: item.quantity > 0 ? item.amount / item.quantity : undefined,
    }));

    try {
      if (isEditMode) {
        const updatePayload: UpdateExpenseInput = {
          title: data.title || undefined,
          expense_date: data.expense_date,
          currency: data.currency,
          note: data.note || undefined,
          items: processedItems,
        };

        await updateExpense.mutateAsync({ id: editId, data: updatePayload });
        router.push('/dashboard/entries');
        return;
      }

      await createExpense.mutateAsync({ ...data, items: processedItems });
      router.push('/dashboard/expenses');
    } catch {}
  };

  const onInvalidSubmit = () => {
    validateItemSelections(getValues('items'));
  };

  const isSaving = createExpense.isPending || updateExpense.isPending;
  const saveError = createExpense.isError || updateExpense.isError;

  if (isEditMode && isExpenseLoading && !expense) {
    return (
      <div className="page-container max-w-2xl space-y-4">
        <div className="h-6 w-28 animate-pulse rounded bg-gray-100" />
        <div className="card-elevated h-32 animate-pulse" />
        <div className="card-elevated h-24 animate-pulse" />
        <div className="card-elevated h-72 animate-pulse" />
      </div>
    );
  }

  if (isEditMode && isExpenseError) {
    return (
      <div className="page-container max-w-2xl">
        <div className="card-elevated py-12 text-center">
          <p className="text-sm text-red-500">Couldn&apos;t load this expense for editing.</p>
          <button type="button" className="btn btn-ghost btn-sm mt-4" onClick={() => router.back()}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl space-y-5">
      <div className="space-y-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-500 transition hover:text-gray-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Expense' : 'Add Expense'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Capture items, payment mode, and category details in one clean entry.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-5">
        {/* Basic Info */}
        <div className="card-elevated space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Title (optional)
              </label>
              <input
                {...register('title')}
                className="input-clean"
                placeholder="Weekly groceries"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Date</label>
              <input
                type="date"
                {...register('expense_date')}
                className={getFieldClass('input-clean', Boolean(errors.expense_date))}
              />
              <FieldError message={errors.expense_date?.message} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Note</label>
            <textarea
              {...register('note')}
              className="input-clean !h-auto min-h-[88px] py-3"
              rows={3}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {/* Bill Scan */}
        <div className="card-elevated bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Scan a bill</p>
              <p className="text-xs text-gray-500">
                Upload a photo and AI will extract items automatically
              </p>
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
                <>
                  <span className="loading loading-spinner loading-xs" /> Scanning...
                </>
              ) : (
                'Upload Bill'
              )}
            </button>
          </div>
          {scanError && <p className="mt-2 text-xs text-red-500">{scanError}</p>}
        </div>

        {/* Items */}
        <div className="card-elevated space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Items</h2>
              <p className="mt-0.5 text-xs text-gray-500">Payment mode is captured per item.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
              onClick={() =>
                append({
                  raw_name: '',
                  amount: 0,
                  quantity: 1,
                  payment_mode: getPreferredPaymentMode(),
                })
              }
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
            const unit = normalizeUnit(watchedItems?.[index]?.unit);
            const unitPrice = qty > 0 && amount > 0 ? (amount / qty).toFixed(2) : '-';

            return (
              <div
                key={field.id}
                className="relative rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                {/* Delete button — top right */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    onClick={() => remove(index)}
                    title="Remove item"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 pr-8 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label className={itemLabelClass}>
                        Category
                      </label>
                      <select
                        {...register(`items.${index}.category_id`, {
                          onChange: () => {
                            setValue(`items.${index}.subcategory_id`, '');
                            clearErrors([
                              `items.${index}.category_id`,
                              `items.${index}.subcategory_id`,
                            ]);
                          },
                        })}
                        className={getFieldClass(
                          'select-clean text-sm',
                          Boolean(errors.items?.[index]?.category_id),
                        )}
                      >
                        <option value="">Select category</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                      <FieldError message={errors.items?.[index]?.category_id?.message} />
                    </div>
                    <div className="sm:col-span-3">
                      <label className={itemLabelClass}>
                        Subcategory
                      </label>
                      <select
                        {...register(`items.${index}.subcategory_id`, {
                          onChange: () => clearErrors(`items.${index}.subcategory_id`),
                        })}
                        className={getFieldClass(
                          'select-clean text-sm',
                          Boolean(errors.items?.[index]?.subcategory_id),
                        )}
                        disabled={!selectedCatId}
                      >
                        <option value="">
                          {selectedCatId ? 'Select subcategory' : 'Choose category first'}
                        </option>
                        {subs.map((sub: any) => (
                          <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                      </select>
                      <FieldError message={errors.items?.[index]?.subcategory_id?.message} />
                    </div>
                    <div className="sm:col-span-5">
                      <label className={itemLabelClass}>
                        Item Name
                      </label>
                      <input
                        {...register(`items.${index}.raw_name`)}
                        className={getFieldClass(
                          'input-clean text-sm',
                          Boolean(errors.items?.[index]?.raw_name),
                        )}
                        placeholder={
                          selectedCatId
                            ? 'e.g. KIIT exam fee, maths notebook'
                            : 'e.g. aloo, milk, exam fee'
                        }
                      />
                      <FieldError message={errors.items?.[index]?.raw_name?.message} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                    <div className="sm:col-span-2">
                      <label className={itemLabelClass}>
                        Qty
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className={getFieldClass(
                          'input-clean text-sm',
                          Boolean(errors.items?.[index]?.quantity),
                        )}
                        placeholder="1"
                      />
                      <FieldError message={errors.items?.[index]?.quantity?.message} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={itemLabelClass}>
                        Unit
                      </label>
                      <select {...register(`items.${index}.unit`)} className="select-clean text-sm">
                        <option value="">No unit</option>
                        <optgroup label="Weight">
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                        </optgroup>
                        <optgroup label="Volume">
                          <option value="L">L</option>
                          <option value="ml">ml</option>
                        </optgroup>
                        <optgroup label="Count">
                          <option value="pcs">pcs</option>
                          <option value="dozen">dozen</option>
                          <option value="pack">pack</option>
                          <option value="box">box</option>
                          <option value="bag">bag</option>
                          <option value="pair">pair</option>
                        </optgroup>
                        <optgroup label="Serving">
                          <option value="plate">plate</option>
                          <option value="serving">serving</option>
                          <option value="cup">cup</option>
                          <option value="slice">slice</option>
                        </optgroup>
                        <optgroup label="Container">
                          <option value="bottle">bottle</option>
                          <option value="can">can</option>
                          <option value="jar">jar</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option value="kWh">kWh</option>
                          <option value="trip">trip</option>
                          <option value="month">month</option>
                          <option value="meter">meter</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className={itemLabelClass}>
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.amount`, { valueAsNumber: true })}
                        className={getFieldClass(
                          'input-clean text-sm',
                          Boolean(errors.items?.[index]?.amount),
                        )}
                        placeholder="0"
                      />
                      <FieldError message={errors.items?.[index]?.amount?.message} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={itemLabelClass}>
                        {unit ? 'Price/Unit' : 'Per item'}
                      </label>
                      <div className="flex h-[38px] items-center rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500">
                        {unitPrice}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <label className={itemLabelClass}>
                        Payment mode
                      </label>
                      <select
                        {...register(`items.${index}.payment_mode`)}
                        className={getFieldClass(
                          'select-clean text-sm',
                          Boolean(errors.items?.[index]?.payment_mode),
                        )}
                      >
                        {PAYMENT_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                      <FieldError message={errors.items?.[index]?.payment_mode?.message} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
            {isSaving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : isEditMode ? (
              'Update Expense'
            ) : (
              'Save Expense'
            )}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.back()}>
            Cancel
          </button>
        </div>

        {saveError && <p className="text-sm text-red-500">Failed to save. Please try again.</p>}
      </form>
    </div>
  );
}

export default function NewExpensePage() {
  return (
    <Suspense fallback={<NewExpensePageFallback />}>
      <NewExpensePageContent />
    </Suspense>
  );
}
