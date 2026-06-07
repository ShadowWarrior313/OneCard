/**
 * @onecard/onecard-engine — the recommend-only brain.
 *
 * Predicts the merchant's likely MCC as a probability distribution, scores the
 * user's cards by expected value, and recommends the best card to pay with.
 * It NEVER processes, charges, proxies, or funds a transaction, and stores no
 * card numbers/CVV — only card identity + reward rules. See README "Guardrails".
 */

// One-call orchestrator (most callers want this).
export { recommend } from "./recommend.js";
export type { RecommendInput, Recommendation } from "./recommend.js";

// MCC prediction.
export { predictMcc } from "./mcc/predict.js";
export type {
  MerchantContext,
  MccCandidate,
  MccPrediction,
} from "./mcc/predict.js";

// Confidence + gating.
export {
  classifyConfidence,
  gate,
  materialCandidates,
  winnerFlips,
} from "./mcc/confidence.js";
export type { ConfidenceBand, GatedRecommendation } from "./mcc/confidence.js";

// Scoring.
export { scoreCards, scoreCard } from "./rewards/score.js";
export type {
  ScoringContext,
  ScoreResult,
  CardScore,
  MccContribution,
} from "./rewards/score.js";

// Explanation.
export { explain } from "./explain/why.js";
export type { Explanation } from "./explain/why.js";

// Reward model + cards.
export {
  cardCategoryForMcc,
  headlineRateForMcc,
  ruleForMcc,
  isAccepted,
} from "./rewards/rewards-rules.js";
export type {
  Card,
  CardNetwork,
  RewardRate,
  RewardsProgram,
} from "./rewards/rewards-rules.js";
export { SAMPLE_WALLET } from "./data/cards.sample.js";

// MCC catalog + merchant map (curated data; editable).
export {
  categoryForMcc,
  labelForMcc,
  lookupMcc,
  allMccs,
  UNKNOWN_MCC,
} from "./mcc/mcc-catalog.js";
export type { Category, MccEntry } from "./mcc/mcc-catalog.js";
export {
  MERCHANTS,
  resolveMerchant,
  normalizeDomain,
} from "./mcc/merchant-mcc-map.js";
export type { MerchantEntry, MccPriors } from "./mcc/merchant-mcc-map.js";

// Ambiguity rules + structural flags.
export {
  applyItemSignals,
  isAmbiguous,
  structuralFlags,
  normalize,
} from "./mcc/ambiguity-rules.js";
export type { AmbiguityFlags } from "./mcc/ambiguity-rules.js";

// Context signal extraction.
export {
  extractOnlineSignals,
  itemHintsFromCategories,
} from "./context/online-signals.js";
export type { OnlinePageInput, OnlineSignals } from "./context/online-signals.js";
export { extractInPersonSignals } from "./context/inperson-signals.js";
export type { InPersonInput, InPersonSignals } from "./context/inperson-signals.js";

// Config.
export { DEFAULT_CONFIG, resolveConfig } from "./config.js";
export type { EngineConfig, GatingMode } from "./config.js";
