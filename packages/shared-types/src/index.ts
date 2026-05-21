/**
 * Normalized spend categories — apples-to-apples across issuers.
 * MCC → category mapping lives in rewards-engine (ISO 18245).
 */
export type RewardCategory =
  | "groceries"
  | "dining"
  | "gas"
  | "travel"
  | "streaming"
  | "recurring_bills"
  | "other";

/**
 * Three routing architectures (toggleable per transaction or user setting).
 * Scenario C: virtual card provisioning at POS — no OneCard settlement rail.
 */
export type RoutingMode =
  | "network_dependent" // A: Visa/MC → processor → underlying card
  | "closed_loop" // B: OneCard captures, async allocation to underlying
  | "virtual_provisioning"; // C: single-use VCN via wallet tokenization

export interface RewardRule {
  category: RewardCategory;
  /** Earn rate relative to base (1x). E.g. 5 = 5x points/cashback on category spend. */
  multiplier: number;
  /** Monthly cap in dollars of eligible spend in this category, if any. */
  capMonthly?: number;
}

export interface CardProduct {
  cardId: string;
  issuer: string;
  displayName: string;
  rewards: RewardRule[];
  annualFee?: number;
  /** Human label: "MR points", "cashback %", "Avion points", etc. */
  currency: string;
  /**
   * Estimated cents per point (or per 1% cashback) for cross-card comparison.
   * Curated dataset should populate this; defaults to 1 cent if unknown.
   */
  pointValueCents?: number;
}

/** Period spend already applied toward a card's category cap. */
export interface CategoryUsage {
  cardId: string;
  category: RewardCategory;
  /** Dollars of eligible spend already charged this billing period. */
  spendThisPeriod: number;
}

export interface UserPreferences {
  /** When true, prefer cards whose currency normalizes to cashback-like value. */
  preferCashback: boolean;
  preferredLoyaltyPrograms?: string[];
  excludedCardIds?: string[];
}

export interface TransactionInput {
  /** Transaction amount in major currency units (e.g. USD, CAD). */
  amount: number;
  merchantName: string;
  /** ISO 18245 MCC code (4 digits, string for leading zeros). */
  mcc: string;
  timestamp?: Date;
}

export interface PortfolioContext {
  cards: CardProduct[];
  usage: CategoryUsage[];
  preferences: UserPreferences;
  /** Card used if user did not optimize — for delta / value-prop metrics. */
  defaultCardId?: string;
}

/** Full input to the routing brain. Mode affects metadata, not card math (v1). */
export interface RoutingContext {
  transaction: TransactionInput;
  portfolio: PortfolioContext;
  mode: RoutingMode;
}

/** One ranked alternative (including the winner). */
export interface CardAlternative {
  cardId: string;
  displayName: string;
  category: RewardCategory;
  multiplier: number;
  /** Normalized reward value in cents (USD/CAD agnostic for demo). */
  estimatedRewardValueCents: number;
  cappedOut: boolean;
  reason: string;
}

/**
 * Output of routeTransaction — what the API and dashboard consume.
 * estimatedRewardValue* fields are normalized to cents for comparison.
 */
export interface RoutingDecision {
  selectedCardId: string;
  selectedCardDisplayName: string;
  category: RewardCategory;
  multiplier: number;
  estimatedRewardValueCents: number;
  estimatedRewardValueNextBestCents: number;
  /** vs portfolio.defaultCardId, if set */
  deltaVsDefaultCents: number;
  deltaVsNextBestCents: number;
  /** Investor-demo copy: "Charged to AMEX Cobalt: 5x MR on dining…" */
  reason: string;
  /** All candidates ranked best-first */
  alternatives: CardAlternative[];
  mode: RoutingMode;
  /**
   * Per-mode stubs: latency model, settlement notes, etc.
   * Populated by mode-specific adapters in rewards-engine.
   */
  modeMetadata: RoutingModeMetadata;
}

export interface RoutingModeMetadata {
  mode: RoutingMode;
  estimatedLatencyMs: number;
  settlementRisk: "low" | "medium" | "high";
  merchantAcceptance: "universal" | "limited" | "digital_only";
  rewardsAttributionAccuracy: "exact" | "approximate" | "delayed";
  regulatoryNotes: string;
}
