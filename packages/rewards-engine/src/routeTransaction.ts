import type {
  CardAlternative,
  RoutingContext,
  RoutingDecision,
} from "@onecard/shared-types";
import { getModeMetadata } from "./modes/index.js";
import { buildWinnerReason } from "./buildReason.js";
import {
  estimateRewardForCard,
  rankEstimates,
} from "./estimateReward.js";
import { isCardAcceptedAtMerchant } from "./cardAcceptance.js";
import { resolveCategory } from "./resolveCategory.js";

/**
 * Core routing brain: score every eligible card, pick the highest normalized
 * reward value, and attach mode metadata for the dashboard.
 */
export function routeTransaction(context: RoutingContext): RoutingDecision {
  const { transaction, portfolio, mode } = context;
  const category = resolveCategory(transaction.mcc, transaction.category);
  const excluded = new Set(portfolio.preferences.excludedCardIds ?? []);

  const eligible = portfolio.cards.filter(
    (c) =>
      !excluded.has(c.cardId) &&
      isCardAcceptedAtMerchant(c, transaction.merchantId),
  );
  if (eligible.length === 0) {
    throw new Error("routeTransaction: no eligible cards in portfolio");
  }

  const cardsById = new Map(eligible.map((c) => [c.cardId, c]));
  const estimates = rankEstimates(
    eligible.map((card) =>
      estimateRewardForCard(card, transaction, category, portfolio),
    ),
    portfolio,
    cardsById,
  );

  const winner = estimates[0]!;
  const runnerUp = estimates[1];
  const alternatives: CardAlternative[] = estimates.map((e) => ({
    cardId: e.cardId,
    displayName: e.displayName,
    category: e.category,
    multiplier: e.multiplier,
    estimatedRewardValueCents: e.estimatedRewardValueCents,
    cappedOut: e.cappedOut,
    reason: e.reason,
  }));

  let defaultValueCents = 0;
  if (portfolio.defaultCardId) {
    const defaultCard = cardsById.get(portfolio.defaultCardId);
    if (defaultCard) {
      defaultValueCents = estimateRewardForCard(
        defaultCard,
        transaction,
        category,
        portfolio,
      ).estimatedRewardValueCents;
    }
  }

  const nextBestCents = runnerUp?.estimatedRewardValueCents ?? 0;

  return {
    selectedCardId: winner.cardId,
    selectedCardDisplayName: winner.displayName,
    category,
    multiplier: winner.multiplier,
    estimatedRewardValueCents: winner.estimatedRewardValueCents,
    estimatedRewardValueNextBestCents: nextBestCents,
    deltaVsDefaultCents:
      Math.round((winner.estimatedRewardValueCents - defaultValueCents) * 100) /
      100,
    deltaVsNextBestCents:
      Math.round((winner.estimatedRewardValueCents - nextBestCents) * 100) /
      100,
    reason: buildWinnerReason(winner, runnerUp, transaction.merchantName),
    alternatives,
    mode,
    modeMetadata: getModeMetadata(mode),
  };
}
