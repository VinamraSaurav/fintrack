export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function startOfMonth(date: string): string {
  return date.slice(0, 7) + '-01';
}

export function endOfMonth(date: string): string {
  const d = new Date(date);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return lastDay.toISOString().split('T')[0];
}

export function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
}

export function titleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
