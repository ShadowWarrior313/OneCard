import { getCardById } from "@/data/cards";
import { merchantById } from "@/data/merchants";
import { estimateRewardForCard } from "@onecard/rewards-engine";
import type { CardProduct, RewardCategory } from "@onecard/shared-types";

export type RoutingRow = {
  name: string;
  rate: string;
  reward: string;
  win: boolean;
};

export interface TapDemoScenario {
  id: string;
  merchantId: string;
  amount: number;
}

export const TAP_DEMO_SCENARIOS: TapDemoScenario[] = [
  { id: "shell", merchantId: "shell", amount: 62 },
  { id: "loblaws", merchantId: "loblaws", amount: 118.4 },
  { id: "uber_eats", merchantId: "uber_eats", amount: 84.5 },
  { id: "netflix", merchantId: "netflix", amount: 16.99 },
  { id: "amazon", merchantId: "amazon", amount: 143.25 },
];

const DEMO_CARD_IDS = [
  "amex_cobalt",
  "cibc_dividend_infinite",
  "scotia_momentum",
  "bmo_eclipse",
  "rbc_ion",
  "td_cashback",
];

function shortCardName(displayName: string): string {
  return displayName
    .replace(/\s+Card$/i, "")
    .replace(/\s+(Visa|Mastercard|American Express).*$/i, "")
    .trim();
}

function multiplierFor(card: CardProduct, category: RewardCategory): number {
  return (
    card.rewards.find((r) => r.category === category)?.multiplier ??
    card.rewards.find((r) => r.category === "other")?.multiplier ??
    1
  );
}

function rateLabel(category: RewardCategory, multiplier: number, currency: string): string {
  const label = category.replace(/_/g, " ");
  if (currency.toLowerCase().includes("cashback")) {
    return `${multiplier}% ${label}`;
  }
  return `${multiplier}× ${label}`;
}

function rewardDollars(
  card: CardProduct,
  scenario: TapDemoScenario,
  category: RewardCategory,
  merchantName: string,
  mcc: string,
): number {
  const est = estimateRewardForCard(
    card,
    {
      amount: scenario.amount,
      merchantName,
      mcc,
      category,
    },
    category,
    { cards: [card], usage: [], preferences: { preferCashback: false } },
  );
  return est.estimatedRewardValueCents / 100;
}

export function formatCad(amount: number): string {
  return `CA$${amount.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function categoryDisplayLabel(category: RewardCategory): string {
  return category.replace(/_/g, " ");
}

export function buildRoutingRowsForScenario(
  walletCards: CardProduct[],
  scenario: TapDemoScenario,
  maxRows = 3,
): { rows: RoutingRow[]; merchantName: string; category: RewardCategory } {
  const merchant = merchantById(scenario.merchantId);
  const merchantName = merchant?.name ?? "Merchant";
  const category = merchant?.category ?? "other";
  const mcc = merchant?.mcc ?? "0000";

  const pool =
    walletCards.length > 0
      ? walletCards
      : DEMO_CARD_IDS.map((id) => getCardById(id)).filter((c): c is CardProduct => Boolean(c));

  const ranked = pool
    .map((card) => ({
      card,
      reward: rewardDollars(card, scenario, category, merchantName, mcc),
    }))
    .sort((a, b) => b.reward - a.reward)
    .slice(0, maxRows);

  const rows: RoutingRow[] = ranked.map((entry, index) => ({
    name: shortCardName(entry.card.displayName),
    rate: rateLabel(category, multiplierFor(entry.card, category), entry.card.currency),
    reward: `$${entry.reward.toFixed(2)}`,
    win: index === 0,
  }));

  if (rows.length === 0) {
    return {
      rows: [{ name: "Your best card", rate: "—", reward: "$0.00", win: true }],
      merchantName,
      category,
    };
  }

  return { rows, merchantName, category };
}

/** @deprecated Use buildRoutingRowsForScenario — kept for showcase tile chips */
export function buildRoutingComparison(cards: CardProduct[]): RoutingRow[] {
  return buildRoutingRowsForScenario(cards, TAP_DEMO_SCENARIOS[0]!).rows;
}
