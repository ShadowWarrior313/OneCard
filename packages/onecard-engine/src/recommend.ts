/**
 * recommend() — the one-call orchestrator that ties the brain together:
 *
 *   predictMcc (distribution) → scoreCards (expected value) → gate (how much
 *   uncertainty to surface) → explain (human rationale).
 *
 * This is a PURE ADVICE function. It returns a recommendation; it never charges
 * a card, never proxies or funds a transaction, and never touches card numbers.
 * That boundary is legal-critical (cross-issuer back-to-back funding is
 * prohibited by Visa/Mastercard US rules) and is enforced by construction: this
 * module has no payment side effects and the data model stores no PAN/CVV.
 */

import { predictMcc, type MccPrediction, type MerchantContext } from "./mcc/predict.js";
import { gate, type GatedRecommendation } from "./mcc/confidence.js";
import { scoreCards, type ScoreResult, type ScoringContext } from "./rewards/score.js";
import type { Card, CardNetwork } from "./rewards/rewards-rules.js";
import { explain, type Explanation } from "./explain/why.js";
import { resolveConfig, type EngineConfig } from "./config.js";

export interface RecommendInput {
  /** What we know about the merchant/checkout. */
  context: MerchantContext;
  /** The user's cards (identity + reward rules only). */
  wallet: Card[];
  /** Transaction amount in dollars. */
  amount: number;
  /**
   * Per-card, per-category spend already booked this period (for cap blending).
   * cardId → (the card's own) category → dollars.
   */
  priorSpend?: ScoringContext["priorSpend"];
  /**
   * Override the merchant's network-acceptance restriction. By default we use
   * the restriction attached to the resolved merchant (if any).
   */
  acceptedNetworks?: CardNetwork[];
  /** Per-call config overrides (thresholds, gating mode). */
  config?: Partial<EngineConfig>;
}

export interface Recommendation {
  /** The MCC probability distribution + confidence/ambiguity. */
  prediction: MccPrediction;
  /** Expected-value scoring across that distribution. */
  score: ScoreResult;
  /** How much uncertainty to surface; the primary pick is the EV winner. */
  gating: GatedRecommendation;
  /** Human-readable rationale + uncertainty disclosure. */
  explanation: Explanation;
  /** Convenience: the recommended card id (always the EV winner). */
  recommendedCardId: string;
}

export function recommend(input: RecommendInput): Recommendation {
  const config = resolveConfig(input.config);

  const prediction = predictMcc(input.context, config);

  const score = scoreCards(prediction, input.wallet, {
    amount: input.amount,
    acceptedNetworks: input.acceptedNetworks ?? prediction.acceptedNetworks,
    priorSpend: input.priorSpend,
  });

  const gating = gate(prediction, score, config);
  const explanation = explain(prediction, score, gating, input.wallet);

  return {
    prediction,
    score,
    gating,
    explanation,
    recommendedCardId: score.winner.cardId,
  };
}
