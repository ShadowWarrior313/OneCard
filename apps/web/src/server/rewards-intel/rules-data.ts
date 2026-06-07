import type { CardRewardCategoryKey, CategoryReward } from "@/data/cardRewards";
import { CARD_REWARD_CONFIGS, getCardRewardConfig } from "@/data/cardRewards";

/**
 * Curated card × category × rate × caps, reusing the engine's dataset.
 *
 * These are intentionally small, curated tracking additions. Dynamic terms are
 * never invented: rotating-category copy directs users to confirm the active
 * quarter with the issuer.
 */
export interface CreditRule {
  cardId: string;
  id: string;
  label: string;
  category: CardRewardCategoryKey;
  amount: number;
  period: "annual";
  ratesAsOf: string;
  needsVerification: boolean;
}

export interface RotationRule {
  cardId: string;
  id: string;
  label: string;
  period: "quarterly";
  ratesAsOf: string;
  needsVerification: boolean;
}

export const CREDIT_RULES: CreditRule[] = [
  {
    cardId: "amex_platinum",
    id: "amex_platinum_annual_travel",
    label: "Annual travel credit",
    category: "travel",
    amount: 200,
    period: "annual",
    ratesAsOf: "2026-01-15",
    needsVerification: true,
  },
];

export const ROTATION_RULES: RotationRule[] = [
  {
    cardId: "discover_it_cash_back",
    id: "discover_it_cash_back_quarter",
    label: "Activate this quarter's 5% category with Discover",
    period: "quarterly",
    ratesAsOf: "2026-05-31",
    needsVerification: true,
  },
];

export function rewardForCategory(
  cardId: string,
  category: CardRewardCategoryKey,
): CategoryReward | undefined {
  const config = getCardRewardConfig(cardId);
  return config?.categories[category] ?? config?.categories.other;
}

export function normalizedRate(cardId: string, category: CardRewardCategoryKey): number {
  const config = getCardRewardConfig(cardId);
  const reward = rewardForCategory(cardId, category);
  return config && reward ? reward.earnRate * config.pointValueCAD : 0;
}

export function curatedCardIds(): string[] {
  return Object.keys(CARD_REWARD_CONFIGS);
}
