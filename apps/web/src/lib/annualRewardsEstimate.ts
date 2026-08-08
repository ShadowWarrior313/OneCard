import {
  estimateRewardForCard,
  getRewardRule,
  routeTransaction,
} from "@onecard/rewards-engine";
import type {
  CardProduct,
  CategoryUsage,
  PortfolioContext,
  RewardCategory,
} from "@onecard/shared-types";
import { merchantById } from "../data/merchants";

export interface SpendCategoryConfig {
  category: RewardCategory;
  label: string;
  merchantId: string;
  defaultMonthly: number;
}

export const ANNUAL_SPEND_CATEGORIES: SpendCategoryConfig[] = [
  { category: "groceries", label: "Groceries", merchantId: "sector_groceries", defaultMonthly: 600 },
  { category: "dining", label: "Dining", merchantId: "sector_dining", defaultMonthly: 350 },
  { category: "gas", label: "Gas", merchantId: "sector_gas", defaultMonthly: 200 },
  { category: "travel", label: "Travel", merchantId: "sector_travel", defaultMonthly: 150 },
  { category: "streaming", label: "Streaming", merchantId: "sector_subscriptions", defaultMonthly: 45 },
  { category: "recurring_bills", label: "Bills & utilities", merchantId: "sector_utilities", defaultMonthly: 120 },
  { category: "other", label: "Everything else", merchantId: "sector_shopping", defaultMonthly: 180 },
];

export type MonthlySpendMap = Record<RewardCategory, number>;

export function defaultMonthlySpend(): MonthlySpendMap {
  const base = ANNUAL_SPEND_CATEGORIES.reduce(
    (acc, row) => {
      acc[row.category] = row.defaultMonthly;
      return acc;
    },
    {} as MonthlySpendMap,
  );
  base.entertainment = 0;
  base.transportation = 0;
  base.drugstore = 0;
  return base;
}

export interface AnnualRewardsComparison {
  defaultAnnual: number;
  routedAnnual: number;
  deltaAnnual: number;
  defaultCardName: string;
}

/**
 * Apply one month's category spend to the usage ledger so sharedCapGroup
 * (RBC Ion combined bonus, CIBC gas+transit, …) depletes across categories
 * instead of resetting for every independent estimate.
 */
export function applyEstimateUsage(
  usage: CategoryUsage[],
  cardId: string,
  category: RewardCategory,
  amount: number,
  card: CardProduct,
): void {
  const rule = getRewardRule(card, category);
  const existing = usage.find(
    (entry) =>
      entry.cardId === cardId &&
      (rule.sharedCapGroup
        ? entry.sharedCapGroup === rule.sharedCapGroup
        : !entry.sharedCapGroup && entry.category === category),
  );
  if (existing) {
    existing.spendThisPeriod += amount;
    return;
  }
  usage.push({
    cardId,
    category: rule.category,
    spendThisPeriod: amount,
    sharedCapGroup: rule.sharedCapGroup,
  });
}

function portfolioWithUsage(
  cards: CardProduct[],
  defaultCardId: string | undefined,
  usage: CategoryUsage[],
): PortfolioContext {
  return {
    cards,
    defaultCardId,
    usage,
    preferences: { preferCashback: false },
  };
}

export function computeAnnualRewardsComparison(
  cards: CardProduct[],
  defaultCardId: string | undefined,
  monthlySpend: MonthlySpendMap,
): AnnualRewardsComparison | null {
  if (cards.length === 0) return null;

  const defaultCard =
    cards.find((c) => c.cardId === defaultCardId) ?? cards[0]!;

  // Separate ledgers: routed path depletes whichever card wins each category;
  // default path depletes only the default card. Shared caps must not reset
  // between independent category estimates.
  const usageRouted: CategoryUsage[] = [];
  const usageDefault: CategoryUsage[] = [];

  let defaultMonthly = 0;
  let routedMonthly = 0;

  for (const row of ANNUAL_SPEND_CATEGORIES) {
    const amount = monthlySpend[row.category] ?? 0;
    if (amount <= 0) continue;

    const merchant = merchantById(row.merchantId);
    if (!merchant) continue;

    const transaction = {
      amount,
      mcc: merchant.mcc,
      category: row.category,
      merchantId: merchant.id,
      merchantName: merchant.name,
    };

    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction,
      portfolio: portfolioWithUsage(cards, defaultCardId, usageRouted),
    });

    routedMonthly += decision.estimatedRewardValueCents / 100;
    const winner = cards.find((c) => c.cardId === decision.selectedCardId);
    if (winner) {
      applyEstimateUsage(usageRouted, winner.cardId, row.category, amount, winner);
    }

    const defaultEstimate = estimateRewardForCard(
      defaultCard,
      transaction,
      row.category,
      portfolioWithUsage(cards, defaultCardId, usageDefault),
    );
    defaultMonthly += defaultEstimate.estimatedRewardValueCents / 100;
    applyEstimateUsage(
      usageDefault,
      defaultCard.cardId,
      row.category,
      amount,
      defaultCard,
    );
  }

  const defaultAnnual = Math.round(defaultMonthly * 12 * 100) / 100;
  const routedAnnual = Math.round(routedMonthly * 12 * 100) / 100;
  const deltaAnnual = Math.round((routedAnnual - defaultAnnual) * 100) / 100;

  return {
    defaultAnnual,
    routedAnnual,
    deltaAnnual,
    defaultCardName: defaultCard.displayName.replace(/\s+Card$/i, ""),
  };
}
