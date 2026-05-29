import { CARD_CATALOG, getCardById } from "@/data/cards";
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

function showcaseRoutingPool(walletCards: CardProduct[]): CardProduct[] {
  return walletCards.length > 0 ? walletCards : CARD_CATALOG;
}

function isAmexIssuerCard(card: CardProduct): boolean {
  return card.issuer === "American Express";
}

type FeeTier = "no_fee" | "mid" | "premium" | "ultra";

const FEE_TIER_ADJACENCY: Record<FeeTier, FeeTier[]> = {
  no_fee: ["mid"],
  mid: ["no_fee", "premium"],
  premium: ["mid", "ultra"],
  ultra: ["premium"],
};

function annualFeeTier(annualFee: number): FeeTier {
  if (annualFee < 75) return "no_fee";
  if (annualFee < 180) return "mid";
  if (annualFee < 400) return "premium";
  return "ultra";
}

function cardAnnualFee(card: CardProduct): number {
  return card.annualFee ?? 0;
}

export type ShowcaseCategoryId = "gas" | "groceries" | "dining" | "travel";

export interface ShowcaseCategory {
  id: ShowcaseCategoryId;
  label: string;
  scenario: TapDemoScenario;
}

export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  { id: "gas", label: "Gas", scenario: { id: "showcase_gas", merchantId: "shell", amount: 62 } },
  {
    id: "groceries",
    label: "Groceries",
    scenario: { id: "showcase_groceries", merchantId: "loblaws", amount: 118.4 },
  },
  {
    id: "dining",
    label: "Dining",
    scenario: { id: "showcase_dining", merchantId: "uber_eats", amount: 84.5 },
  },
  {
    id: "travel",
    label: "Travel",
    scenario: { id: "showcase_travel", merchantId: "sector_travel", amount: 420 },
  },
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

function rankCardsForScenario(
  pool: CardProduct[],
  scenario: TapDemoScenario,
  category: RewardCategory,
  merchantName: string,
  mcc: string,
) {
  return pool
    .map((card) => ({
      card,
      reward: rewardDollars(card, scenario, category, merchantName, mcc),
    }))
    .sort((a, b) => b.reward - a.reward);
}

/** Dining is the one category where an Amex card may headline the comparison. */
const SHOWCASE_AMEX_WIN_CATEGORY: ShowcaseCategoryId = "dining";

/** Skip Amex when it ranks #1 (except dining); avoid repeat Simplii / RBC Ion headlines. */
function pickShowcaseWinner(
  ranked: ReturnType<typeof rankCardsForScenario>,
  categoryId: ShowcaseCategoryId,
) {
  if (ranked.length === 0) return { winner: undefined, amexSkipped: false };

  if (categoryId === SHOWCASE_AMEX_WIN_CATEGORY) {
    const amexBest = ranked.find((entry) => isAmexIssuerCard(entry.card));
    if (amexBest) return { winner: amexBest, amexSkipped: false };
  }

  let winner = ranked[0]!;
  let amexSkipped = false;

  if (isAmexIssuerCard(winner.card)) {
    const next = ranked.find((entry) => !isAmexIssuerCard(entry.card));
    if (next) {
      winner = next;
      amexSkipped = true;
    }
  }

  if (winner.card.cardId === "simplii_cashback_visa") {
    const next = ranked.find(
      (entry) =>
        !isAmexIssuerCard(entry.card) && entry.card.cardId !== "simplii_cashback_visa",
    );
    if (next) winner = next;
  }

  if (winner.card.cardId === "rbc_ion") {
    const midAlternative = ranked.find(
      (entry) =>
        !isAmexIssuerCard(entry.card) &&
        entry.card.cardId !== "rbc_ion" &&
        annualFeeTier(cardAnnualFee(entry.card)) === "mid" &&
        entry.reward >= winner.reward * 0.88,
    );
    if (midAlternative) winner = midAlternative;
  }

  return { winner, amexSkipped };
}

function pickShowcaseComparisonRows(
  ranked: ReturnType<typeof rankCardsForScenario>,
  winner: (typeof ranked)[number],
  amexSkipped: boolean,
  maxRows: number,
) {
  const eligible = amexSkipped
    ? ranked.filter((entry) => !isAmexIssuerCard(entry.card))
    : ranked;

  const winnerTier = annualFeeTier(cardAnnualFee(winner.card));
  const picked: typeof ranked = [];
  const seen = new Set<string>();

  const push = (entry: (typeof ranked)[number]) => {
    if (picked.length >= maxRows || seen.has(entry.card.cardId)) return;
    seen.add(entry.card.cardId);
    picked.push(entry);
  };

  push(winner);

  for (const entry of eligible) {
    if (annualFeeTier(cardAnnualFee(entry.card)) === winnerTier) push(entry);
  }

  for (const adjacentTier of FEE_TIER_ADJACENCY[winnerTier]) {
    for (const entry of eligible) {
      if (annualFeeTier(cardAnnualFee(entry.card)) === adjacentTier) push(entry);
    }
  }

  for (const entry of eligible) push(entry);

  return picked.slice(0, maxRows);
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

export function buildShowcaseCategoryRows(
  categoryId: ShowcaseCategoryId,
  walletCards: CardProduct[] = [],
  maxRows = 3,
): { rows: RoutingRow[]; merchantName: string; category: RewardCategory; amountLabel: string } {
  const showcaseCategory =
    SHOWCASE_CATEGORIES.find((c) => c.id === categoryId) ?? SHOWCASE_CATEGORIES[0]!;
  const { scenario } = showcaseCategory;
  const merchant = merchantById(scenario.merchantId);
  const merchantName = merchant?.name ?? "Merchant";
  const category = merchant?.category ?? "other";
  const mcc = merchant?.mcc ?? "0000";
  const pool = showcaseRoutingPool(walletCards);
  const ranked = rankCardsForScenario(pool, scenario, category, merchantName, mcc);
  const { winner, amexSkipped } = pickShowcaseWinner(ranked, categoryId);

  if (!winner) {
    return {
      rows: [{ name: "Your best card", rate: "—", reward: "$0.00", win: true }],
      merchantName,
      category,
      amountLabel: formatCad(scenario.amount),
    };
  }

  const ordered = pickShowcaseComparisonRows(ranked, winner, amexSkipped, maxRows);

  const rows: RoutingRow[] = ordered.map((entry, index) => ({
    name: shortCardName(entry.card.displayName),
    rate: rateLabel(category, multiplierFor(entry.card, category), entry.card.currency),
    reward: `$${entry.reward.toFixed(2)}`,
    win: index === 0,
  }));

  return {
    rows,
    merchantName,
    category,
    amountLabel: formatCad(scenario.amount),
  };
}

/** @deprecated Use buildRoutingRowsForScenario — kept for showcase tile chips */
export function buildRoutingComparison(cards: CardProduct[]): RoutingRow[] {
  return buildRoutingRowsForScenario(cards, TAP_DEMO_SCENARIOS[0]!).rows;
}
