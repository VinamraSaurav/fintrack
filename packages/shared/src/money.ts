export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundOptionalMoney(value: number | null | undefined): number | null | undefined {
  if (value == null) return value;
  return roundMoney(value);
}
