import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, PortfolioContext, RewardCategory } from "@onecard/shared-types";
import { merchantById } from "@/data/merchants";

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
  return ANNUAL_SPEND_CATEGORIES.reduce(
    (acc, row) => {
      acc[row.category] = row.defaultMonthly;
      return acc;
    },
    {} as MonthlySpendMap,
  );
}

export interface AnnualRewardsComparison {
  defaultAnnual: number;
  routedAnnual: number;
  deltaAnnual: number;
  defaultCardName: string;
}

function emptyPortfolio(
  cards: CardProduct[],
  defaultCardId: string | undefined,
): PortfolioContext {
  return {
    cards,
    defaultCardId,
    usage: [],
    preferences: { preferCashback: false },
  };
}

export function computeAnnualRewardsComparison(
  cards: CardProduct[],
  defaultCardId: string | undefined,
  monthlySpend: MonthlySpendMap,
): AnnualRewardsComparison | null {
  if (cards.length === 0) return null;

  const portfolio = emptyPortfolio(cards, defaultCardId);
  const defaultCard =
    cards.find((c) => c.cardId === defaultCardId) ?? cards[0]!;

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
      portfolio,
    });

    routedMonthly += decision.estimatedRewardValueCents / 100;

    const defaultEstimate = estimateRewardForCard(
      defaultCard,
      transaction,
      row.category,
      portfolio,
    );
    defaultMonthly += defaultEstimate.estimatedRewardValueCents / 100;
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
