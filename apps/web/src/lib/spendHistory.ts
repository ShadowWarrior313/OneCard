import type { RewardCategory } from "@onecard/shared-types";

export type SpendPeriod = "week" | "month" | "quarter" | "year";

export interface SpendRecord {
  id: string;
  timestamp: string;
  merchantId: string;
  merchantName: string;
  category: RewardCategory;
  amount: number;
  purchaseType: "personal" | "business";
  selectedCardId: string;
  selectedCardDisplayName: string;
  defaultCardId?: string;
  rewardCents: number;
  defaultRewardCents: number;
  deltaVsDefaultCents: number;
  multiplier: number;
}

export interface PeriodRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
  prevLabel: string;
}

const CATEGORY_LABELS: Record<RewardCategory, string> = {
  groceries: "Groceries",
  dining: "Dining",
  gas: "Gas",
  travel: "Travel",
  streaming: "Streaming",
  recurring_bills: "Bills",
  other: "Other",
};

export function categoryLabel(c: RewardCategory): string {
  return CATEGORY_LABELS[c];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function getPeriodRange(period: SpendPeriod, ref = new Date()): PeriodRange {
  const now = ref;

  if (period === "week") {
    const end = endOfDay(now);
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - 6);
    const prevEnd = endOfDay(new Date(start));
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = startOfDay(new Date(prevEnd));
    prevStart.setDate(prevStart.getDate() - 6);
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: "Last 7 days",
      prevLabel: "Prior 7 days",
    };
  }

  if (period === "month") {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = endOfDay(now);
    const prevEnd = endOfDay(new Date(start));
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = startOfDay(new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1));
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: now.toLocaleString("en-CA", { month: "long", year: "numeric" }),
      prevLabel: prevStart.toLocaleString("en-CA", { month: "long", year: "numeric" }),
    };
  }

  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const start = startOfDay(new Date(now.getFullYear(), q * 3, 1));
    const end = endOfDay(now);
    const prevEnd = endOfDay(new Date(start));
    prevEnd.setDate(prevEnd.getDate() - 1);
    const pq = Math.floor(prevEnd.getMonth() / 3);
    const prevStart = startOfDay(new Date(prevEnd.getFullYear(), pq * 3, 1));
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: `Q${q + 1} ${now.getFullYear()}`,
      prevLabel: `Q${pq + 1} ${prevEnd.getFullYear()}`,
    };
  }

  const start = startOfDay(new Date(now.getFullYear(), 0, 1));
  const end = endOfDay(now);
  const prevStart = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
  const prevEnd = endOfDay(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
  return {
    start,
    end,
    prevStart,
    prevEnd,
    label: `${now.getFullYear()} YTD`,
    prevLabel: `${now.getFullYear() - 1} (same period)`,
  };
}

export function filterRecordsInRange(
  records: SpendRecord[],
  start: Date,
  end: Date,
): SpendRecord[] {
  const t0 = start.getTime();
  const t1 = end.getTime();
  return records.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t >= t0 && t <= t1;
  });
}

export interface CardAggregate {
  cardId: string;
  name: string;
  spend: number;
  rewards: number;
}

export interface CategoryAggregate {
  category: RewardCategory;
  label: string;
  spend: number;
  rewards: number;
}

export interface PeriodComparisonRow {
  key: string;
  label: string;
  current: number;
  previous: number;
}

export function aggregateByCard(records: SpendRecord[]): CardAggregate[] {
  const map = new Map<string, CardAggregate>();
  for (const r of records) {
    const existing = map.get(r.selectedCardId);
    if (existing) {
      existing.spend += r.amount;
      existing.rewards += r.rewardCents / 100;
    } else {
      map.set(r.selectedCardId, {
        cardId: r.selectedCardId,
        name: r.selectedCardDisplayName.replace(/\s+Card$/i, ""),
        spend: r.amount,
        rewards: r.rewardCents / 100,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

export function aggregateByCategory(records: SpendRecord[]): CategoryAggregate[] {
  const map = new Map<RewardCategory, CategoryAggregate>();
  for (const r of records) {
    const existing = map.get(r.category);
    if (existing) {
      existing.spend += r.amount;
      existing.rewards += r.rewardCents / 100;
    } else {
      map.set(r.category, {
        category: r.category,
        label: categoryLabel(r.category),
        spend: r.amount,
        rewards: r.rewardCents / 100,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

export function summarizeRecords(records: SpendRecord[]) {
  const spend = records.reduce((s, r) => s + r.amount, 0);
  const rewards = records.reduce((s, r) => s + r.rewardCents, 0) / 100;
  const defaultRewards = records.reduce((s, r) => s + r.defaultRewardCents, 0) / 100;
  const extra = rewards - defaultRewards;
  return { spend, rewards, defaultRewards, extra, count: records.length };
}

/** Monthly buckets for year view */
export function monthlyBuckets(records: SpendRecord[], year: number) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    label: new Date(year, i, 1).toLocaleString("en-CA", { month: "short" }),
    spend: 0,
    rewards: 0,
  }));

  for (const r of records) {
    const d = new Date(r.timestamp);
    if (d.getFullYear() !== year) continue;
    const m = months[d.getMonth()]!;
    m.spend += r.amount;
    m.rewards += r.rewardCents / 100;
  }

  return months;
}

export function comparisonByCard(
  current: SpendRecord[],
  previous: SpendRecord[],
): PeriodComparisonRow[] {
  const cur = aggregateByCard(current);
  const prev = aggregateByCard(previous);
  const keys = new Set([...cur.map((c) => c.cardId), ...prev.map((p) => p.cardId)]);

  return [...keys].map((cardId) => {
    const c = cur.find((x) => x.cardId === cardId);
    const p = prev.find((x) => x.cardId === cardId);
    return {
      key: cardId,
      label: c?.name ?? p?.name ?? cardId,
      current: c?.spend ?? 0,
      previous: p?.spend ?? 0,
    };
  }).sort((a, b) => b.current - a.current);
}

export function comparisonByCategory(
  current: SpendRecord[],
  previous: SpendRecord[],
): PeriodComparisonRow[] {
  const cur = aggregateByCategory(current);
  const prev = aggregateByCategory(previous);
  const keys = new Set([
    ...cur.map((c) => c.category),
    ...prev.map((p) => p.category),
  ]);

  return [...keys].map((cat) => {
    const c = cur.find((x) => x.category === cat);
    const p = prev.find((x) => x.category === cat);
    return {
      key: cat,
      label: c?.label ?? p?.label ?? cat,
      current: c?.spend ?? 0,
      previous: p?.spend ?? 0,
    };
  }).sort((a, b) => b.current - a.current);
}

export function shortCardName(displayName: string): string {
  return displayName.replace(/\s+Card$/i, "").replace(/\s+(Visa|Mastercard).*$/i, "");
}
