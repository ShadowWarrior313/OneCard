/** Round and format a number to a fixed decimal count (default 1). */
export function formatDecimal(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function formatMultiplier(value: number): string {
  return `${formatDecimal(value, 1)}×`;
}
