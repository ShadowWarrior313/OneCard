import type {
  CardProduct,
  CategoryUsage,
  PortfolioContext,
  RewardCategory,
  RewardRule,
  TransactionInput,
} from "@onecard/shared-types";
import { getRewardRule } from "./getRewardRule.js";

const DEFAULT_POINT_VALUE_CENTS = 1;

export interface RewardEstimate {
  cardId: string;
  displayName: string;
  category: RewardCategory;
  /** Effective earn rate after cap blending (may differ from headline multiplier). */
  multiplier: number;
  estimatedRewardValueCents: number;
  cappedOut: boolean;
  reason: string;
}

/** Spend already counted toward this card's category cap this period. */
export function getCategorySpend(
  usage: CategoryUsage[],
  cardId: string,
  category: RewardCategory,
  sharedCapGroup?: string,
): number {
  if (sharedCapGroup) {
    return usage
      .filter((u) => u.cardId === cardId && u.sharedCapGroup === sharedCapGroup)
      .reduce((sum, u) => sum + u.spendThisPeriod, 0);
  }
  return (
    usage.find((u) => u.cardId === cardId && u.category === category)
      ?.spendThisPeriod ?? 0
  );
}

export {
  getRewardRule,
} from "./getRewardRule.js";

/**
 * Blends bonus vs base rate when monthly/annual cap is partially exhausted.
 * cap* fields are dollars of eligible spend at the bonus multiplier.
 */
export function effectiveMultiplier(
  rule: RewardRule,
  otherRule: RewardRule,
  amount: number,
  spendThisPeriod: number,
): { multiplier: number; cappedOut: boolean } {
  const cap = rule.capMonthly ?? rule.capAnnual;
  if (cap === undefined) {
    return { multiplier: rule.multiplier, cappedOut: false };
  }

  const remainingCap = Math.max(0, cap - spendThisPeriod);
  if (remainingCap <= 0) {
    return { multiplier: otherRule.multiplier, cappedOut: true };
  }

  if (amount <= remainingCap) {
    return { multiplier: rule.multiplier, cappedOut: false };
  }

  const bonusPortion = remainingCap;
  const basePortion = amount - remainingCap;
  const blended =
    (bonusPortion * rule.multiplier + basePortion * otherRule.multiplier) /
    amount;
  return { multiplier: blended, cappedOut: false };
}

export function pointValueCents(card: CardProduct): number {
  return card.pointValueCents ?? DEFAULT_POINT_VALUE_CENTS;
}

/** Preference tie-breaker in cents (not added to displayed reward value). */
export function preferenceBiasCents(
  card: CardProduct,
  preferences: PortfolioContext["preferences"],
): number {
  let bias = 0;
  if (preferences.preferCashback && card.currency.toLowerCase().includes("cashback")) {
    bias += 0.5;
  }
  const programs = preferences.preferredLoyaltyPrograms ?? [];
  if (
    programs.some(
      (p) =>
        card.issuer.toLowerCase().includes(p.toLowerCase()) ||
        card.cardId.toLowerCase().includes(p.toLowerCase()) ||
        card.displayName.toLowerCase().includes(p.toLowerCase()),
    )
  ) {
    bias += 0.5;
  }
  return bias;
}

export function estimateRewardForCard(
  card: CardProduct,
  transaction: TransactionInput,
  category: RewardCategory,
  portfolio: PortfolioContext,
): RewardEstimate {
  const merchantId = transaction.merchantId;
  const rule = getRewardRule(card, category, merchantId);
  const otherRule = getRewardRule(card, "other", merchantId);
  const spend = getCategorySpend(
    portfolio.usage,
    card.cardId,
    rule.category,
    rule.sharedCapGroup,
  );
  const capLimit = rule.capMonthly ?? rule.capAnnual;
  const { multiplier, cappedOut } = effectiveMultiplier(
    rule,
    otherRule,
    transaction.amount,
    spend,
  );

  const valueCents =
    transaction.amount * multiplier * pointValueCents(card);
  const capNote = cappedOut
    ? ` (${rule.category} cap exhausted — earning at ${otherRule.multiplier}x)`
    : capLimit !== undefined && spend + transaction.amount > capLimit
      ? ` (partial cap — blended ${multiplier.toFixed(2)}x this purchase)`
      : "";

  const partnerNote =
    rule.merchantIds?.length && merchantId
      ? " (partner merchant)"
      : "";

  const reason = cappedOut
    ? `${card.displayName}: ${otherRule.multiplier}x on ${category} (category cap reached)${capNote}`
    : `${card.displayName}: ${multiplier}x ${card.currency} on ${category}${partnerNote}${capNote}`;

  return {
    cardId: card.cardId,
    displayName: card.displayName,
    category,
    multiplier,
    estimatedRewardValueCents: Math.round(valueCents * 100) / 100,
    cappedOut,
    reason,
  };
}

export function rankEstimates(
  estimates: RewardEstimate[],
  portfolio: PortfolioContext,
  cardsById: Map<string, CardProduct>,
): RewardEstimate[] {
  return [...estimates].sort((a, b) => {
    const cardA = cardsById.get(a.cardId)!;
    const cardB = cardsById.get(b.cardId)!;
    const biasA = preferenceBiasCents(cardA, portfolio.preferences);
    const biasB = preferenceBiasCents(cardB, portfolio.preferences);
    const scoreA = a.estimatedRewardValueCents + biasA;
    const scoreB = b.estimatedRewardValueCents + biasB;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.cardId.localeCompare(b.cardId);
  });
}
