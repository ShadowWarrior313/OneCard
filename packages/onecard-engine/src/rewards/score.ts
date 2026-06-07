/**
 * Expected-value scoring across the MCC distribution.
 *
 * We do NOT score only the top MCC. For each card we compute:
 *
 *   EV(card) = amount × Σ over candidate MCCs [ p(mcc) × rate(card, mcc) ]
 *
 * respecting per-category caps. The recommended card is the highest-EV card.
 *
 * This is what makes the engine behave correctly under uncertainty: a flat 2%
 * everywhere card beats a 5% groceries card when groceries is only, say, 30%
 * likely — because 0.30×5% + 0.70×1% = 2.2% ... actually < 2%? No: it depends
 * on the numbers, and THAT is the point. EV does the arithmetic so the robust
 * catch-all wins exactly when it should (food truck, unknown merchant) and the
 * category card wins when the category is likely enough (clean grocery store).
 */

import { type Category } from "../mcc/mcc-catalog.js";
import type { MccPrediction } from "../mcc/predict.js";
import {
  cardCategoryForMcc,
  isAccepted,
  type Card,
  type CardNetwork,
} from "./rewards-rules.js";

export interface ScoringContext {
  /** Transaction amount in dollars. */
  amount: number;
  /** Merchant network restriction; cards on other networks are unusable here. */
  acceptedNetworks?: CardNetwork[];
  /**
   * Spend already booked this period, per card and per (the card's own)
   * category — used for cap blending. Optional; absent means no caps reached.
   */
  priorSpend?: Record<string, Partial<Record<Category, number>>>;
}

export interface MccContribution {
  mcc: string;
  label: string;
  p: number;
  /** The card's OWN category for this MCC (per-program mapping). */
  cardCategory: Category;
  /** Effective (cap-blended) rate this card earns if the MCC is this one. */
  rate: number;
  /** p × rate × amount — this MCC's contribution to the card's EV. */
  valueDollars: number;
}

export interface CardScore {
  cardId: string;
  displayName: string;
  accepted: boolean;
  /** Expected reward value in dollars across the whole MCC distribution. */
  expectedValueDollars: number;
  /** EV as a fraction of spend (EV / amount) — handy for explanations. */
  expectedRate: number;
  perMcc: MccContribution[];
  isCatchAll: boolean;
}

export interface ScoreResult {
  /** Accepted cards only, sorted best-first by expected value. */
  ranked: CardScore[];
  winner: CardScore;
  runnerUp?: CardScore;
  /** EV(winner) − EV(runner-up), in dollars. */
  evGapToSecondDollars: number;
  /**
   * The best card *if a given candidate MCC were certain*. Keyed by MCC.
   * Gating uses this to detect whether the winner "flips" depending on how the
   * merchant rings up — the signal that we should surface an alternative.
   */
  winnerByMcc: Record<string, string>;
}

/** Cap-blended effective rate for a card at one MCC, given the amount/usage. */
function effectiveRate(
  card: Card,
  mcc: string,
  ctx: ScoringContext,
): { rate: number; category: Category } {
  const category = cardCategoryForMcc(card, mcc);
  const rule = card.program.rates[category];
  const base = card.program.baseRate;
  if (!rule) return { rate: base, category };
  if (rule.capPerPeriod === undefined) return { rate: rule.rate, category };

  const spent = ctx.priorSpend?.[card.cardId]?.[category] ?? 0;
  const remaining = Math.max(0, rule.capPerPeriod - spent);
  if (remaining <= 0) return { rate: base, category }; // cap exhausted → base
  if (ctx.amount <= remaining) return { rate: rule.rate, category };
  // Purchase straddles the cap: blend bonus and base over the amount.
  const blended =
    (remaining * rule.rate + (ctx.amount - remaining) * base) / ctx.amount;
  return { rate: blended, category };
}

/** Score a single card across the full MCC distribution. */
export function scoreCard(
  card: Card,
  prediction: MccPrediction,
  ctx: ScoringContext,
): CardScore {
  const accepted = isAccepted(card, ctx.acceptedNetworks);
  const perMcc: MccContribution[] = prediction.candidates.map((c) => {
    const { rate, category } = effectiveRate(card, c.mcc, ctx);
    return {
      mcc: c.mcc,
      label: c.label,
      p: c.p,
      cardCategory: category,
      rate,
      valueDollars: c.p * rate * ctx.amount,
    };
  });
  const expectedValueDollars = perMcc.reduce((s, m) => s + m.valueDollars, 0);
  return {
    cardId: card.cardId,
    displayName: card.displayName,
    accepted,
    expectedValueDollars,
    expectedRate: ctx.amount > 0 ? expectedValueDollars / ctx.amount : 0,
    perMcc,
    isCatchAll: card.isCatchAll ?? false,
  };
}

/** Best accepted card if a single MCC were certain (used for flip detection). */
function bestCardForMcc(
  mcc: string,
  cards: Card[],
  ctx: ScoringContext,
): string | undefined {
  let bestId: string | undefined;
  let bestRate = -Infinity;
  for (const card of cards) {
    if (!isAccepted(card, ctx.acceptedNetworks)) continue;
    const { rate } = effectiveRate(card, mcc, ctx);
    if (rate > bestRate || (rate === bestRate && bestId !== undefined && card.cardId < bestId)) {
      bestRate = rate;
      bestId = card.cardId;
    }
  }
  return bestId;
}

/**
 * Score every card and rank by expected value. Deterministic tie-break by
 * cardId so results are stable in tests and across runs.
 */
export function scoreCards(
  prediction: MccPrediction,
  wallet: Card[],
  ctx: ScoringContext,
): ScoreResult {
  const scored = wallet.map((card) => scoreCard(card, prediction, ctx));
  const ranked = scored
    .filter((s) => s.accepted)
    .sort((a, b) =>
      b.expectedValueDollars !== a.expectedValueDollars
        ? b.expectedValueDollars - a.expectedValueDollars
        : a.cardId.localeCompare(b.cardId),
    );

  if (ranked.length === 0) {
    throw new Error(
      "scoreCards: no usable card (all filtered by merchant network acceptance)",
    );
  }

  const winner = ranked[0]!;
  const runnerUp = ranked[1];

  const winnerByMcc: Record<string, string> = {};
  for (const c of prediction.candidates) {
    const best = bestCardForMcc(c.mcc, wallet, ctx);
    if (best) winnerByMcc[c.mcc] = best;
  }

  return {
    ranked,
    winner,
    runnerUp,
    evGapToSecondDollars:
      winner.expectedValueDollars - (runnerUp?.expectedValueDollars ?? 0),
    winnerByMcc,
  };
}
