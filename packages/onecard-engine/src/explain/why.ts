/**
 * why.ts — human-readable rationale + uncertainty disclosure.
 *
 * The goal is to turn a *surprising-but-correct* answer (a razor at Walmart
 * earning a discount-store rate, a candy bar at a hotel earning a lodging rate)
 * into a *trustworthy* one. We always state the basis — the merchant MCC, not
 * the item — and we surface uncertainty only when the gating policy says to.
 */

import { labelForMcc } from "../mcc/mcc-catalog.js";
import type { MccPrediction } from "../mcc/predict.js";
import type { CardScore, ScoreResult } from "../rewards/score.js";
import type { GatedRecommendation } from "../mcc/confidence.js";
import type { Card } from "../rewards/rewards-rules.js";

export interface Explanation {
  /** One-liner: the recommendation itself. */
  headline: string;
  /** The basis: why this card, stated in terms of the merchant MCC. */
  detail: string;
  /** Uncertainty disclosure, present only when gating surfaces it. */
  uncertaintyNote?: string;
  /** A concrete "if it rings up as X, use Y" alternative, when applicable. */
  alternativeHint?: string;
  /** Everything joined into one block of copy. */
  text: string;
}

function pct(rate: number): string {
  const v = Math.round(rate * 1000) / 10; // one decimal
  return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
}

function money(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

function rateAtMcc(score: CardScore | undefined, mcc: string): number | undefined {
  return score?.perMcc.find((m) => m.mcc === mcc)?.rate;
}

export function explain(
  prediction: MccPrediction,
  score: ScoreResult,
  gating: GatedRecommendation,
  wallet: Card[],
): Explanation {
  const byId = new Map(wallet.map((c) => [c.cardId, c]));
  const scoreById = new Map(score.ranked.map((s) => [s.cardId, s]));

  const primary = score.winner;
  const primaryName = primary.displayName;
  const merchant = prediction.merchantName;
  const top = prediction.candidates[0]!;
  const topCategory = top.category;
  const primaryTopRate = rateAtMcc(primary, top.mcc) ?? primary.expectedRate;

  // Delta vs the user's catch-all (or runner-up if the primary IS the catch-all).
  const catchAll = score.ranked.find((s) => s.isCatchAll);
  const comparison =
    catchAll && catchAll.cardId !== primary.cardId ? catchAll : score.runnerUp;
  const deltaDollars = comparison
    ? primary.expectedValueDollars - comparison.expectedValueDollars
    : 0;
  const deltaText =
    comparison && deltaDollars > 0.005
      ? ` ${money(deltaDollars)} more than ${comparison.displayName}.`
      : "";

  // ---- headline -------------------------------------------------------------
  let headline: string;
  if (!gating.surfaceUncertainty) {
    headline = `Best card: ${primaryName} — ${merchant} codes as ${topCategory} (${pct(
      primaryTopRate,
    )}).${deltaText}`;
  } else {
    headline = `Best card: ${primaryName}.${deltaText}`;
  }

  // ---- detail: always state the basis (merchant MCC, not item) --------------
  let detail: string;
  if (prediction.flags.bigBox) {
    detail = `${merchant} is a big-box store: the whole basket codes under one merchant category (${topCategory}), so the item type doesn't change the rate. A category-bonus card only wins here if it actually rings up as that category.`;
  } else if (prediction.flags.hostVenue) {
    detail = `Purchases inside ${merchant} usually code as the venue itself (${topCategory}) — even small sundry items — so we recommend on the venue's category, not the item.`;
  } else if (prediction.flags.mobileVendor) {
    detail = `${merchant} is a mobile/pop-up vendor; these often code as convenience or misc retail rather than the food category you'd expect, so the safest expected-value pick is your everywhere card.`;
  } else if (top.mcc === "0000") {
    detail = `We couldn't identify ${merchant}, so we can't predict its category. Your everywhere card is the safe expected-value pick until we learn how it codes.`;
  } else {
    detail = `Based on ${merchant}'s most likely category (${topCategory} — MCC ${top.mcc} ${labelForMcc(
      top.mcc,
    )}), not the items in the cart.`;
  }

  // ---- uncertainty note + alternative ---------------------------------------
  let uncertaintyNote: string | undefined;
  let alternativeHint: string | undefined;

  if (gating.surfaceUncertainty) {
    if (prediction.flags.composite && prediction.ambiguous) {
      // Split recommendation across the material sub-venues.
      const parts = prediction.candidates
        .filter((c) => c.p >= top.p - 0.25)
        .map((c) => {
          const winnerId = score.winnerByMcc[c.mcc];
          const wName = winnerId ? byId.get(winnerId)?.displayName ?? winnerId : primaryName;
          const wRate = rateAtMcc(scoreById.get(winnerId ?? ""), c.mcc);
          const rateStr = wRate !== undefined ? ` (${pct(wRate)})` : "";
          return `if it codes as ${c.category}, use ${wName}${rateStr}`;
        });
      uncertaintyNote = `This is a composite venue — ${parts.join("; ")}.`;
    } else if (gating.alternativeCardId) {
      const altName =
        byId.get(gating.alternativeCardId)?.displayName ?? gating.alternativeCardId;
      const altMcc = gating.alternativeForMcc;
      const altCategory = altMcc ? labelForMcc(altMcc) : "another category";
      const altRate = rateAtMcc(scoreById.get(gating.alternativeCardId), altMcc ?? "");
      const rateStr = altRate !== undefined ? ` (${pct(altRate)})` : "";
      alternativeHint = `If this rings up as ${altCategory.toLowerCase()}, use ${altName}${rateStr} instead.`;
      uncertaintyNote = `The best card depends on how this rings up. ${alternativeHint}`;
    } else if (gating.band === "low") {
      uncertaintyNote = `We're not confident how this will code, so we're playing it safe with your everywhere card.`;
    } else {
      uncertaintyNote = `Moderate confidence in the category — ${primaryName} is the best expected-value pick either way.`;
    }
  }

  const text = [headline, detail, uncertaintyNote]
    .filter((s): s is string => Boolean(s))
    .join(" ");

  return { headline, detail, uncertaintyNote, alternativeHint, text };
}
