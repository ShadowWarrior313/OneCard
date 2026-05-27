/** Format currency amounts with 2 decimal places. */
export function formatMoney(value: number): string {
  return value.toFixed(2);
}

/** Format percentages with 0 decimal places. */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Round and format a number to a fixed decimal count (default 2). */
export function formatDecimal(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function formatMultiplier(value: number): string {
  return `${formatDecimal(value, 1)}×`;
}
