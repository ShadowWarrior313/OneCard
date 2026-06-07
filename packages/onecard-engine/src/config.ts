/**
 * Engine-wide thresholds and the confidence-gating policy.
 *
 * These are intentionally data, not magic numbers buried in logic, so the
 * behaviour of the "brain" can be tuned without touching prediction/scoring
 * code. Everything here is advice-layer configuration — none of it ever
 * touches money movement (see GUARDRAILS in the README).
 */

/**
 * How much uncertainty we surface to the user.
 *
 * - `confidence_gated` (DEFAULT, recommended): present the recommendation
 *   cleanly when we're confident AND the winner doesn't depend on which MCC
 *   the merchant rings up as; otherwise still recommend the expected-value
 *   winner but attach a short uncertainty note + a one-tap alternative.
 *
 * - `always_silent` (riskier, opt-in): only ever show the single highest-EV
 *   card, with no uncertainty UI. Cleaner, but it can be *confidently wrong*
 *   on ambiguous merchants. This matters more for us than for the (illegal)
 *   back-to-back-funding products that could read the network-assigned MCC
 *   live: as a pure advice layer we NEVER get to verify the real MCC, so we
 *   can never guarantee correctness the way a proxy charge did. Keep the
 *   default honest.
 *
 * In BOTH modes the underlying pick is the same expected-value winner — the
 * gating mode only controls how much uncertainty reaches the user.
 */
export type GatingMode = "confidence_gated" | "always_silent";

export interface EngineConfig {
  /**
   * topConfidence at/above which we treat the MCC prediction as trustworthy
   * enough to present cleanly (subject also to the winner being stable).
   */
  HIGH_CONFIDENCE: number;
  /** Below this we treat the prediction as low-confidence (fail-safe territory). */
  LOW_CONFIDENCE: number;
  /**
   * If the #2 candidate's probability is within this gap of the top
   * candidate, the merchant is treated as ambiguous (genuine coin-flip
   * between MCCs). Also used to decide which candidates are "material" enough
   * to matter for winner-stability checks.
   */
  AMBIGUITY_GAP: number;
  /** Default gating mode. Must remain confidence_gated. */
  GATING_MODE: GatingMode;
}

export const DEFAULT_CONFIG: EngineConfig = {
  HIGH_CONFIDENCE: 0.8,
  LOW_CONFIDENCE: 0.5,
  AMBIGUITY_GAP: 0.25,
  GATING_MODE: "confidence_gated",
};

/** Merge caller overrides over the defaults. */
export function resolveConfig(overrides?: Partial<EngineConfig>): EngineConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}
