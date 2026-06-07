/**
 * Confidence scoring, thresholds, and the gating policy — how uncertainty
 * reaches (or doesn't reach) the user.
 *
 * The pick is ALWAYS the expected-value winner from score.ts. Gating only
 * decides how much uncertainty to surface around it:
 *
 *   confidence_gated (DEFAULT): present cleanly only when we're confident AND
 *   the winner doesn't depend on which MCC the merchant rings up as. Otherwise
 *   still recommend the EV winner, but attach a short note + a one-tap
 *   alternative ("If this rings up as dining, use Y instead").
 *
 *   always_silent: never show uncertainty UI. Cleaner, but can be confidently
 *   wrong on ambiguous merchants — riskier precisely because, as a recommend-
 *   only tool, we never get to verify the real MCC.
 */

import type { MccCandidate, MccPrediction } from "./predict.js";
import type { ScoreResult } from "../rewards/score.js";
import type { EngineConfig, GatingMode } from "../config.js";

export type ConfidenceBand = "high" | "medium" | "low";

export function classifyConfidence(
  topConfidence: number,
  config: EngineConfig,
): ConfidenceBand {
  if (topConfidence >= config.HIGH_CONFIDENCE) return "high";
  if (topConfidence >= config.LOW_CONFIDENCE) return "medium";
  return "low";
}

/**
 * Candidates "material" to the decision: within AMBIGUITY_GAP of the top.
 * A 3%-probability runner-up behind a 97% leader is immaterial and shouldn't
 * force an uncertainty note; a 45% runner-up behind a 55% leader is material.
 */
export function materialCandidates(
  prediction: MccPrediction,
  config: EngineConfig,
): MccCandidate[] {
  const top = prediction.candidates[0];
  if (!top) return [];
  return prediction.candidates.filter((c) => c.p >= top.p - config.AMBIGUITY_GAP);
}

/** True if the best card differs across the material MCC candidates. */
export function winnerFlips(
  prediction: MccPrediction,
  score: ScoreResult,
  config: EngineConfig,
): boolean {
  const winners = new Set(
    materialCandidates(prediction, config)
      .map((c) => score.winnerByMcc[c.mcc])
      .filter((id): id is string => id !== undefined),
  );
  return winners.size > 1;
}

export interface GatedRecommendation {
  mode: GatingMode;
  /** Always the expected-value winner — gating never changes the pick. */
  primaryCardId: string;
  band: ConfidenceBand;
  /** Whether to show the uncertainty note + alternative in the UI. */
  surfaceUncertainty: boolean;
  /** One-tap alternative when the winner flips by MCC. */
  alternativeCardId?: string;
  /** The MCC scenario under which the alternative would be the better card. */
  alternativeForMcc?: string;
  /** Why we're surfacing uncertainty (for explanation copy / debugging). */
  disclosureReason?:
    | "ambiguous"
    | "winner_flips"
    | "low_confidence"
    | "below_high_confidence";
}

/**
 * Apply the gating policy. `primaryCardId` is always the EV winner; everything
 * else here is about how much uncertainty to show.
 */
export function gate(
  prediction: MccPrediction,
  score: ScoreResult,
  config: EngineConfig,
): GatedRecommendation {
  const band = classifyConfidence(prediction.topConfidence, config);
  const primaryCardId = score.winner.cardId;
  const flips = winnerFlips(prediction, score, config);

  // always_silent: show only the single highest-EV card. Documented as riskier.
  if (config.GATING_MODE === "always_silent") {
    return { mode: "always_silent", primaryCardId, band, surfaceUncertainty: false };
  }

  // confidence_gated (default): clean only when confident AND winner is stable.
  const clean = band === "high" && !flips && !prediction.ambiguous;
  if (clean) {
    return {
      mode: "confidence_gated",
      primaryCardId,
      band,
      surfaceUncertainty: false,
    };
  }

  // Surface uncertainty. If the winner flips, offer the alternative that would
  // win under the next plausible MCC.
  let alternativeCardId: string | undefined;
  let alternativeForMcc: string | undefined;
  if (flips) {
    const alt = materialCandidates(prediction, config).find((c) => {
      const w = score.winnerByMcc[c.mcc];
      return w !== undefined && w !== primaryCardId;
    });
    if (alt) {
      alternativeCardId = score.winnerByMcc[alt.mcc];
      alternativeForMcc = alt.mcc;
    }
  }

  const disclosureReason: GatedRecommendation["disclosureReason"] =
    prediction.ambiguous
      ? "ambiguous"
      : flips
        ? "winner_flips"
        : band === "low"
          ? "low_confidence"
          : "below_high_confidence";

  return {
    mode: "confidence_gated",
    primaryCardId,
    band,
    surfaceUncertainty: true,
    alternativeCardId,
    alternativeForMcc,
    disclosureReason,
  };
}
