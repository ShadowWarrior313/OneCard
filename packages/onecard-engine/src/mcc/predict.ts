/**
 * predictMcc — produce a ranked MCC distribution + confidence for a context.
 *
 * The central idea of the whole engine: an MCC is a PROBABILITY DISTRIBUTION,
 * not a single value. We never see the real network-assigned MCC (that would
 * require proxying the charge, which is out of scope and legally distinct), so
 * we predict, quantify confidence, and never confidently mislead.
 *
 * Pipeline:
 *   1. Resolve the merchant (key / domain / name) → candidate MCCs + priors.
 *      Unknown merchant → a single low-confidence "unknown" candidate.
 *   2. Pick the sub-venue distribution if the caller knows it (e.g. fuel pump).
 *   3. Extract cart/item hints (online + in-person) and let them reweight the
 *      prior — only among the merchant's own candidate MCCs (ambiguity-rules).
 *   4. Normalize, sort, and compute topConfidence + the ambiguous flag.
 *
 * topConfidence = priorStrength (how well we know this merchant) × p(top
 * candidate) (how peaked the distribution is). So a single but shaky guess for
 * an unknown merchant still reads as low confidence — which is the honest signal.
 */

import { UNKNOWN_MCC, labelForMcc, categoryForMcc, type Category } from "./mcc-catalog.js";
import {
  resolveMerchant,
  type MccPriors,
  type MerchantEntry,
} from "./merchant-mcc-map.js";
import {
  applyItemSignals,
  isAmbiguous,
  normalize,
  structuralFlags,
  type AmbiguityFlags,
} from "./ambiguity-rules.js";
import {
  extractOnlineSignals,
  type OnlinePageInput,
} from "../context/online-signals.js";
import {
  extractInPersonSignals,
  type InPersonInput,
} from "../context/inperson-signals.js";
import { type CardNetwork } from "../rewards/rewards-rules.js";
import { DEFAULT_CONFIG, type EngineConfig } from "../config.js";

/** Everything we know about a purchase context, before scoring any card. */
export interface MerchantContext {
  /** Stable merchant key if the host app already knows it. */
  merchantKey?: string;
  /** Merchant name as seen on a page header / receipt. */
  merchantName?: string;
  /** Online checkout domain or URL. */
  domain?: string;
  /** "online" | "in_person" | "unknown" — affects which signal path runs. */
  channel?: "online" | "in_person" | "unknown";
  /**
   * Known sub-venue at a composite/host merchant ("fuel", "restaurant",
   * "warehouse", ...). When present, we use the merchant's sub-venue
   * distribution and treat the prediction as non-ambiguous.
   */
  subVenue?: string;
  /** Raw online checkout page to extract signals from. */
  online?: OnlinePageInput;
  /** Raw in-person context (V2 stub). */
  inPerson?: InPersonInput;
  /** Pre-classified item category hints, if the host already mapped the cart. */
  itemHints?: Category[][];
}

export interface MccCandidate {
  mcc: string;
  label: string;
  /** Global/canonical category for display. Cards re-bucket this per program. */
  category: Category;
  /** Probability this is the MCC the merchant rings up as. */
  p: number;
}

export interface MccPrediction {
  /** Ranked candidates, descending by probability; probabilities sum to ~1. */
  candidates: MccCandidate[];
  /** priorStrength × p(top) — overall trust in the top guess. */
  topConfidence: number;
  /** True when the top two are close, or the merchant is inherently uncertain. */
  ambiguous: boolean;
  /** Structural facts about the merchant, for explanations/gating. */
  flags: AmbiguityFlags;
  /** What we used to decide — for explainability/debugging. */
  signalsUsed: string[];
  /** Resolved merchant display name (or the raw name / "Unknown merchant"). */
  merchantName: string;
  /** Network acceptance restriction from the merchant entry, if any. */
  acceptedNetworks?: CardNetwork[];
}

/** Build the ordered candidate list from a normalized prior map. */
function toCandidates(priors: MccPriors): MccCandidate[] {
  return Object.entries(priors)
    .map(([mcc, p]) => ({
      mcc,
      label: labelForMcc(mcc),
      category: categoryForMcc(mcc),
      p,
    }))
    .sort((a, b) => (b.p !== a.p ? b.p - a.p : a.mcc.localeCompare(b.mcc)));
}

/** The fail-safe prediction when we can't identify the merchant. */
function unknownPrediction(merchantName: string, signalsUsed: string[]): MccPrediction {
  signalsUsed.push("merchant not in catalog — failing safe to low confidence");
  const candidates = toCandidates({ [UNKNOWN_MCC]: 1 });
  return {
    candidates,
    // Low, regardless of the single candidate: we simply don't know.
    topConfidence: 0.25,
    ambiguous: false,
    flags: structuralFlags(undefined),
    signalsUsed,
    merchantName,
    acceptedNetworks: undefined,
  };
}

/** Choose the merchant's base priors, honoring a known sub-venue. */
function basePriors(
  entry: MerchantEntry,
  subVenue: string | undefined,
  signalsUsed: string[],
): { priors: MccPriors; subVenueResolved: boolean } {
  if (subVenue && entry.subVenues?.[subVenue]) {
    signalsUsed.push(`sub-venue:${subVenue}`);
    return { priors: { ...entry.subVenues[subVenue] }, subVenueResolved: true };
  }
  return { priors: { ...entry.priors }, subVenueResolved: false };
}

export function predictMcc(
  context: MerchantContext,
  config: EngineConfig = DEFAULT_CONFIG,
): MccPrediction {
  const signalsUsed: string[] = [];

  // ---- gather signals (online + in-person), which can supply a domain/name --
  const online = context.online ? extractOnlineSignals(context.online) : undefined;
  if (online) signalsUsed.push(...online.notes);
  const inPerson = context.inPerson
    ? extractInPersonSignals(context.inPerson)
    : undefined;
  if (inPerson) signalsUsed.push(...inPerson.notes);

  const domain = context.domain ?? online?.domain;
  const merchantName =
    context.merchantName ?? inPerson?.merchantName ?? context.merchantKey;
  const subVenue = context.subVenue ?? inPerson?.subVenue;

  // ---- resolve merchant -----------------------------------------------------
  const resolution = resolveMerchant({
    merchantKey: context.merchantKey,
    domain,
    merchantName,
  });

  if (!resolution) {
    return unknownPrediction(merchantName ?? "Unknown merchant", signalsUsed);
  }

  const { entry, via } = resolution;
  signalsUsed.push(`merchant:${entry.key} (via ${via})`);
  const flags = structuralFlags(entry);

  // ---- base priors (sub-venue aware) ----------------------------------------
  const { priors: base, subVenueResolved } = basePriors(entry, subVenue, signalsUsed);

  // ---- item signals reweight the prior (never invent a category) ------------
  const itemHints = [
    ...(online?.itemHints ?? []),
    ...(inPerson?.itemHints ?? []),
    ...(context.itemHints ?? []),
  ];
  const reweighted = applyItemSignals(base, itemHints, entry, signalsUsed);

  // ---- finalize -------------------------------------------------------------
  const candidates = toCandidates(normalize(reweighted));
  const top = candidates[0]!;
  const topConfidence = entry.priorStrength * top.p;

  // A resolved sub-venue means we know which venue we're at → not ambiguous.
  const ambiguous = subVenueResolved
    ? false
    : isAmbiguous(
        candidates.map((c) => c.p),
        flags,
        config.AMBIGUITY_GAP,
      );

  return {
    candidates,
    topConfidence,
    ambiguous,
    flags,
    signalsUsed,
    merchantName: entry.displayName,
    acceptedNetworks: entry.acceptedNetworks,
  };
}
