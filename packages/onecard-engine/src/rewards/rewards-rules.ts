/**
 * Card reward model — the value source.
 *
 * Two design choices that matter for correctness:
 *
 * 1. Rates are expressed as an EFFECTIVE CASH-VALUE FRACTION (0.05 = "5% back").
 *    A 5x points card valued at 1¢/pt is 0.05; a 4x at 1.5¢/pt is 0.06. This
 *    keeps cross-card expected-value math in plain dollars and sidesteps points
 *    valuation in the engine core.
 *
 * 2. The MCC → category mapping is PER PROGRAM, not global. Real cards disagree:
 *    some count 5814 "fast food" as dining, some don't; some exclude
 *    superstores from the grocery bonus. A program declares its own overrides;
 *    otherwise it falls back to the catalog's canonical category. Modeling this
 *    globally is a real source of wrong recommendations — so we don't.
 *
 * This module stores only card *identity* and *reward rules* — never card
 * numbers, CVV, or anything needed to charge. The engine recommends; it never
 * processes a payment.
 */

import { type Category, categoryForMcc } from "../mcc/mcc-catalog.js";

export type CardNetwork = "visa" | "mastercard" | "amex" | "discover";

export interface RewardRate {
  /** Effective value fraction, e.g. 0.05 = 5% back. */
  rate: number;
  /**
   * Optional spend cap (in dollars of eligible spend) per period at this rate.
   * Spend beyond the cap earns the program's base rate. Cap usage is supplied
   * at scoring time (see ScoringContext.priorSpend).
   */
  capPerPeriod?: number;
}

export interface RewardsProgram {
  programId: string;
  /** Catch-all rate for any category without a bonus entry. */
  baseRate: number;
  /**
   * Per-program MCC → category overrides. THIS is the per-program mapping:
   * e.g. mapping "5814": "dining" makes the program count fast food as dining;
   * omitting it leaves 5814 as the canonical "fast_food", which (absent a
   * fast_food bonus) earns base. Either form expresses "does/doesn't count
   * fast food as dining".
   */
  mccCategoryOverrides?: Partial<Record<string, Category>>;
  /** Bonus rates keyed by this program's category label. */
  rates: Partial<Record<Category, RewardRate>>;
}

export interface Card {
  cardId: string;
  displayName: string;
  issuer: string;
  network: CardNetwork;
  program: RewardsProgram;
  /**
   * Marks a strong everywhere/flat card. Used by explanations and as the
   * fail-safe pick when the MCC is unknown — it does NOT change scoring (the
   * EV winner is computed purely from rates).
   */
  isCatchAll?: boolean;
}

/**
 * Resolve THIS card's reward category for an MCC, applying the program's
 * per-program override before falling back to the global catalog category.
 */
export function cardCategoryForMcc(card: Card, mcc: string): Category {
  const override = card.program.mccCategoryOverrides?.[mcc];
  return override ?? categoryForMcc(mcc);
}

/**
 * Headline (uncapped) effective rate for this card at an MCC. Cap blending is
 * applied separately at scoring time, where the transaction amount and prior
 * spend are known.
 */
export function headlineRateForMcc(card: Card, mcc: string): number {
  const cat = cardCategoryForMcc(card, mcc);
  return card.program.rates[cat]?.rate ?? card.program.baseRate;
}

/** The card's reward rule for an MCC's category, if it has a bonus entry. */
export function ruleForMcc(card: Card, mcc: string): RewardRate | undefined {
  const cat = cardCategoryForMcc(card, mcc);
  return card.program.rates[cat];
}

/** True if the card is accepted under a merchant's network restriction. */
export function isAccepted(card: Card, acceptedNetworks?: CardNetwork[]): boolean {
  if (!acceptedNetworks || acceptedNetworks.length === 0) return true;
  return acceptedNetworks.includes(card.network);
}
