import { routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RewardCategory } from "@onecard/shared-types";

/**
 * Recurring service bill-pay — hydro, mortgage, rent, tuition, or any recurring
 * service. Each bill has an amount, a cadence, and either a chosen card or
 * "auto" (route to whichever card earns the most for that category).
 *
 * Demo only — no real money moves. State persists in localStorage.
 */

export type BillFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";

export type BillCategory =
  | "utilities"
  | "mortgage"
  | "rent"
  | "tuition"
  | "phone"
  | "internet"
  | "insurance"
  | "subscription"
  | "other";

/** "auto" routes to the best card for the category; otherwise a wallet cardId. */
export type BillCardChoice = string | "auto";

export interface RecurringBill {
  id: string;
  name: string;
  category: BillCategory;
  amount: number;
  frequency: BillFrequency;
  card: BillCardChoice;
  autopay: boolean;
  nextDate: string; // ISO yyyy-mm-dd
  createdAt: string;
}

export const BILL_CATEGORIES: { value: BillCategory; label: string; placeholder: string }[] = [
  { value: "utilities", label: "Hydro / Utilities", placeholder: "Hydro One" },
  { value: "mortgage", label: "Mortgage", placeholder: "Mortgage" },
  { value: "rent", label: "Rent", placeholder: "Rent" },
  { value: "tuition", label: "Tuition", placeholder: "University tuition" },
  { value: "phone", label: "Phone", placeholder: "Rogers mobile" },
  { value: "internet", label: "Internet", placeholder: "Bell Fibe" },
  { value: "insurance", label: "Insurance", placeholder: "Auto insurance" },
  { value: "subscription", label: "Subscription", placeholder: "Netflix" },
  { value: "other", label: "Other service", placeholder: "Recurring service" },
];

export const BILL_FREQUENCIES: { value: BillFrequency; label: string; short: string }[] = [
  { value: "weekly", label: "Every week", short: "weekly" },
  { value: "biweekly", label: "Every 2 weeks", short: "biweekly" },
  { value: "monthly", label: "Every month", short: "monthly" },
  { value: "quarterly", label: "Every 3 months", short: "quarterly" },
  { value: "annually", label: "Every year", short: "annually" },
];

/** Reward category each bill type posts under (for auto-routing). */
const CATEGORY_TO_REWARD: Record<BillCategory, RewardCategory> = {
  utilities: "recurring_bills",
  phone: "recurring_bills",
  internet: "recurring_bills",
  insurance: "recurring_bills",
  subscription: "streaming",
  tuition: "education",
  mortgage: "other",
  rent: "other",
  other: "other",
};

export function frequencyShort(f: BillFrequency): string {
  return BILL_FREQUENCIES.find((x) => x.value === f)?.short ?? f;
}

export function categoryLabel(c: BillCategory): string {
  return BILL_CATEGORIES.find((x) => x.value === c)?.label ?? c;
}

/** Per-month equivalent of an amount at a given cadence (for totals). */
export function monthlyEquivalent(amount: number, f: BillFrequency): number {
  switch (f) {
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "annually":
      return amount / 12;
  }
}

export function computeNextDate(f: BillFrequency, from: Date = new Date()): string {
  const d = new Date(from);
  switch (f) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "annually":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

export function formatBillDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMoney(amount: number): string {
  return `CA$${amount.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Resolve the best card for a bill's category using the routing engine.
 * Returns the winning card id + display name, or null if the wallet is empty.
 */
export function bestCardForCategory(
  cards: CardProduct[],
  category: BillCategory,
  amount: number,
): { cardId: string; displayName: string } | null {
  if (cards.length === 0) return null;
  const decision = routeTransaction({
    transaction: {
      amount: amount > 0 ? amount : 1,
      merchantName: "Recurring bill",
      mcc: "0000",
      category: CATEGORY_TO_REWARD[category],
    },
    portfolio: {
      cards,
      usage: [],
      preferences: { preferCashback: false },
      defaultCardId: cards[0]?.cardId,
    },
    mode: "virtual_provisioning",
  });
  return { cardId: decision.selectedCardId, displayName: decision.selectedCardDisplayName };
}

// ── storage ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "onecard_recurring_bills_v1";

export function readRecurringBills(): RecurringBill[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RecurringBill[];
  } catch {
    return null;
  }
}

export function writeRecurringBills(bills: RecurringBill[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
}

/** Example bills so the page isn't empty on first visit. */
export function seedRecurringBills(): RecurringBill[] {
  const now = new Date();
  const mk = (
    id: string,
    name: string,
    category: BillCategory,
    amount: number,
    frequency: BillFrequency,
    card: BillCardChoice,
  ): RecurringBill => ({
    id,
    name,
    category,
    amount,
    frequency,
    card,
    autopay: true,
    nextDate: computeNextDate(frequency, now),
    createdAt: now.toISOString(),
  });
  return [
    mk("seed_hydro", "Hydro One", "utilities", 94.2, "monthly", "auto"),
    mk("seed_rent", "Rent", "rent", 2100, "monthly", "auto"),
    mk("seed_internet", "Bell Fibe", "internet", 85, "monthly", "auto"),
  ];
}
