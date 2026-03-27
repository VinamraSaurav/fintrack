import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

function parseDateValue(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

function padDate(value: number): string {
  return String(value).padStart(2, '0');
}

export function getTodayDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`;
}

export function getCurrentMonthValue(date = new Date()): string {
  return `${date.getFullYear()}-${padDate(date.getMonth() + 1)}`;
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseDateValue(dateStr));
}

export function formatMonthValue(monthStr: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthStr)) return monthStr;

  const [year, month] = monthStr.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export function formatRelativeDate(dateStr: string): string {
  const date = parseDateValue(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - target.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return `${days} days ago`;
  return formatDate(dateStr);
}
