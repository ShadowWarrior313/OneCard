export type TaxCountry = "CA" | "US";

export interface TaxRegion {
  code: string;
  label: string;
}

/** Demo rates — not tax advice. Combined sales tax where applicable. */
const CA_RATES: Record<string, { label: string; rate: number }> = {
  ON: { label: "HST", rate: 0.13 },
  BC: { label: "GST + PST", rate: 0.12 },
  AB: { label: "GST", rate: 0.05 },
  SK: { label: "GST + PST", rate: 0.11 },
  MB: { label: "GST + PST", rate: 0.12 },
  QC: { label: "GST + QST", rate: 0.14975 },
  NS: { label: "HST", rate: 0.15 },
  NB: { label: "HST", rate: 0.15 },
  NL: { label: "HST", rate: 0.15 },
  PE: { label: "HST", rate: 0.15 },
};

const US_RATES: Record<string, { label: string; rate: number }> = {
  CA: { label: "Sales tax", rate: 0.0875 },
  NY: { label: "Sales tax", rate: 0.08 },
  TX: { label: "Sales tax", rate: 0.0625 },
  FL: { label: "Sales tax", rate: 0.06 },
  WA: { label: "Sales tax", rate: 0.065 },
  IL: { label: "Sales tax", rate: 0.0625 },
  PA: { label: "Sales tax", rate: 0.06 },
  OR: { label: "Sales tax", rate: 0 },
  DE: { label: "Sales tax", rate: 0 },
  NH: { label: "Sales tax", rate: 0 },
  MT: { label: "Sales tax", rate: 0 },
};

export const CA_PROVINCES: TaxRegion[] = [
  { code: "ON", label: "Ontario" },
  { code: "BC", label: "British Columbia" },
  { code: "AB", label: "Alberta" },
  { code: "QC", label: "Quebec" },
  { code: "NS", label: "Nova Scotia" },
  { code: "MB", label: "Manitoba" },
  { code: "SK", label: "Saskatchewan" },
  { code: "NB", label: "New Brunswick" },
  { code: "NL", label: "Newfoundland & Labrador" },
  { code: "PE", label: "Prince Edward Island" },
];

export const US_STATES: TaxRegion[] = [
  { code: "CA", label: "California" },
  { code: "NY", label: "New York" },
  { code: "TX", label: "Texas" },
  { code: "FL", label: "Florida" },
  { code: "WA", label: "Washington" },
  { code: "IL", label: "Illinois" },
  { code: "PA", label: "Pennsylvania" },
  { code: "OR", label: "Oregon" },
  { code: "DE", label: "Delaware" },
  { code: "NH", label: "New Hampshire" },
];

export function defaultRegion(country: TaxCountry): string {
  return country === "CA" ? "ON" : "CA";
}

export function computeTax(
  subtotal: number,
  country: TaxCountry,
  regionCode: string,
): {
  subtotal: number;
  taxAmount: number;
  total: number;
  label: string;
  rate: number;
  regionLabel: string;
} {
  const table = country === "CA" ? CA_RATES : US_RATES;
  const regions = country === "CA" ? CA_PROVINCES : US_STATES;
  const entry = table[regionCode] ?? (country === "CA" ? CA_RATES.ON : US_RATES.CA);
  const regionLabel =
    regions.find((r) => r.code === regionCode)?.label ?? regionCode;
  const taxAmount = Math.round(subtotal * entry.rate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    subtotal,
    taxAmount,
    total,
    label: entry.label,
    rate: entry.rate,
    regionLabel,
  };
}

export function currencySymbol(country: TaxCountry): string {
  return country === "CA" ? "CA$" : "US$";
}
