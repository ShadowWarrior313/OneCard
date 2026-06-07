/**
 * Structural multi-MCC handling — the famous failure cases.
 *
 * Each real-world situation where one physical/online merchant maps to several
 * plausible MCCs is handled explicitly here:
 *
 *   - Composite venues (gas + attached QSR, mall food court, airport): one
 *     location authorizes under very different MCCs. Keep multiple candidates;
 *     the merchant's flat priors already encode the coin-flip.
 *   - Host-venue bleed (hotel sundry, stadium concession, theme park): a candy
 *     bar inside a hotel codes as the hotel, not as convenience. So item
 *     signals are IGNORED for host venues — we don't "correct" toward the
 *     obvious item category.
 *   - Mobile / while-traveling (food truck, farmers market, pop-up): tends to
 *     code convenience/misc rather than dining. Treated as inherently ambiguous
 *     so scoring prefers a robust catch-all via expected value.
 *   - Big-box / supercenter (Walmart, Target, Costco): the whole basket codes
 *     under ONE merchant MCC. Cart items may only shift probability BETWEEN the
 *     merchant's own candidate MCCs — never invent a category the merchant won't
 *     code. This is the razor-at-Walmart fix and it's enforced in
 *     applyItemSignals below.
 */

import { type Category, categoryForMcc } from "./mcc-catalog.js";
import type { MccPriors, MerchantEntry } from "./merchant-mcc-map.js";

export interface AmbiguityFlags {
  composite: boolean;
  hostVenue: boolean;
  bigBox: boolean;
  mobileVendor: boolean;
}

export function structuralFlags(entry?: MerchantEntry): AmbiguityFlags {
  return {
    composite: entry?.composite ?? false,
    hostVenue: entry?.hostVenue ?? false,
    bigBox: entry?.bigBox ?? false,
    mobileVendor: entry?.mobileVendor ?? false,
  };
}

/** Boost applied to a candidate whose category a cart item matches. Modest, so
 * one item nudges the prior without ever steamrolling the merchant's coding. */
const ITEM_NUDGE_FACTOR = 1.6;

/**
 * Reweight candidate MCCs using cart/item hints — the ONLY way item data is
 * allowed to influence the prediction.
 *
 * Invariants (this is where the razor bug is structurally prevented):
 *   1. Host venues: item signals are ignored entirely (host-bleed).
 *   2. Otherwise: a hint can only boost a candidate the merchant ALREADY codes
 *      as. A hint whose categories aren't among the candidates is dropped — we
 *      never add a new MCC/category because of an item. (Razor at Walmart can
 *      nudge discount-vs-grocery, but can never introduce beauty/drugstore.)
 *
 * `itemHints` is a list of ranked category guesses per item; for each item we
 * apply the first guess that matches an existing candidate.
 */
export function applyItemSignals(
  priors: MccPriors,
  itemHints: Category[][],
  entry: MerchantEntry | undefined,
  signalsUsed: string[],
): MccPriors {
  if (itemHints.length === 0) return priors;

  if (entry?.hostVenue) {
    signalsUsed.push(
      "host-venue bleed: cart/item signals ignored (purchases code as the host)",
    );
    return priors;
  }

  // Category present among the merchant's candidate MCCs → set of those MCCs.
  const candidateCategories = new Map<Category, string[]>();
  for (const mcc of Object.keys(priors)) {
    const cat = categoryForMcc(mcc);
    const list = candidateCategories.get(cat) ?? [];
    list.push(mcc);
    candidateCategories.set(cat, list);
  }

  const adjusted: MccPriors = { ...priors };
  for (const ranked of itemHints) {
    const matched = ranked.find((c) => candidateCategories.has(c));
    if (!matched) {
      // The invariant in action: the item suggests a category the merchant
      // doesn't code, so it changes nothing.
      signalsUsed.push(
        `item suggests ${ranked.join("/")} — not coded by this merchant, ignored`,
      );
      continue;
    }
    for (const mcc of candidateCategories.get(matched)!) {
      adjusted[mcc] = (adjusted[mcc] ?? 0) * ITEM_NUDGE_FACTOR;
    }
    if (entry?.bigBox) {
      signalsUsed.push(
        `big-box: item nudges prior toward ${matched} (still the merchant MCC, not the item's own category)`,
      );
    } else {
      signalsUsed.push(`item nudges prior toward ${matched}`);
    }
  }
  return normalize(adjusted);
}

/** Normalize a prior map so probabilities sum to ~1. */
export function normalize(priors: MccPriors): MccPriors {
  const total = Object.values(priors).reduce((s, p) => s + p, 0);
  if (total <= 0) return priors;
  const out: MccPriors = {};
  for (const [mcc, p] of Object.entries(priors)) out[mcc] = p / total;
  return out;
}

/**
 * Decide whether a (sorted, normalized) candidate list is ambiguous:
 *   - the top two candidates are within AMBIGUITY_GAP of each other, OR
 *   - the merchant is a mobile vendor (inherently uncertain coding).
 *
 * Composite venues surface as ambiguous through the gap when their default
 * priors are a genuine coin-flip (gas+QSR), but read as confident when one
 * sub-venue dominates (a warehouse club's store vs its minority fuel pump).
 */
export function isAmbiguous(
  sortedProbsDesc: number[],
  flags: AmbiguityFlags,
  ambiguityGap: number,
): boolean {
  if (flags.mobileVendor) return true;
  if (sortedProbsDesc.length < 2) return false;
  const [top, second] = sortedProbsDesc as [number, number, ...number[]];
  return top - second < ambiguityGap;
}
