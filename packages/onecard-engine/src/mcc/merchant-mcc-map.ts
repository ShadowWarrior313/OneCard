/**
 * Curated merchant → candidate-MCC priors.
 *
 * For known merchants/brands/domains we store the MCCs they plausibly ring up
 * as, with prior probabilities. These priors ARE the data — they're meant to be
 * edited and refined over time (the schema makes that easy). We never scrape
 * live; V1 is curated only.
 *
 * Structural ambiguity (a single venue that can authorize under very different
 * MCCs) is encoded with the flags below and consumed by ambiguity-rules.ts.
 */

import type { CardNetwork } from "../rewards/rewards-rules.js";

/** A discrete probability over candidate MCCs. Keys are MCC strings. */
export type MccPriors = Record<string, number>;

export interface MerchantEntry {
  /** Stable key, e.g. "walmart". */
  key: string;
  displayName: string;
  /** Domains that resolve to this merchant (online checkout). */
  domains?: string[];
  /** Lowercased name fragments that resolve to this merchant (receipts/POS). */
  nameMatches?: string[];

  /** Default candidate MCCs + priors when no sub-venue is known. Should sum ~1. */
  priors: MccPriors;

  /**
   * Curation confidence in this merchant's mapping, independent of how peaked
   * the distribution is. A well-understood national grocer is ~0.96; a vaguely
   * matched or volatile merchant is lower. This multiplies into topConfidence
   * so a single-but-shaky guess still reads as low confidence.
   */
  priorStrength: number;

  /**
   * Sub-venue overrides for composite locations. If the caller knows the
   * sub-venue (e.g. "fuel" at a wholesale club, "restaurant" at a hotel) we use
   * that distribution instead of `priors` and treat it as non-ambiguous.
   */
  subVenues?: Record<string, MccPriors>;

  // ---- structural ambiguity flags (drive ambiguity-rules + explanations) ----

  /**
   * Big-box / supercenter: the WHOLE basket codes under one merchant MCC
   * regardless of items. Cart items may only shift the prior between this
   * merchant's own MCCs — never invent a new category. (The razor-at-Walmart fix.)
   */
  bigBox?: boolean;
  /**
   * Composite venue: one location can authorize under very different MCCs
   * (gas + attached QSR, mall food court, airport). Surfaces a split rec.
   */
  composite?: boolean;
  /**
   * Host-venue bleed: purchases inside a host venue tend to code as the host
   * (candy bar at a hotel → lodging, not convenience). Item signals are
   * ignored so we don't "correct" toward the obvious item category.
   */
  hostVenue?: boolean;
  /**
   * Mobile / while-traveling (food truck, farmers market, pop-up): frequently
   * codes as convenience/misc rather than the expected dining MCC. Lower
   * confidence and prefer a robust catch-all.
   */
  mobileVendor?: boolean;

  /** Optional network acceptance restriction (e.g. Costco US = Visa only). */
  acceptedNetworks?: CardNetwork[];
}

/**
 * The curated catalog. Every entry here is illustrative, hand-tuned data —
 * realistic but not authoritative. Refine priors as real coding data arrives.
 */
export const MERCHANTS: MerchantEntry[] = [
  // ---- Big-box / supercenter ------------------------------------------------
  {
    key: "walmart",
    displayName: "Walmart",
    domains: ["walmart.com"],
    nameMatches: ["walmart", "wal-mart", "walmart supercenter"],
    // Supercenters overwhelmingly code as discount (5310); only sometimes as
    // grocery. This is exactly why a grocery-bonus card usually earns base here.
    priors: { "5310": 0.8, "5411": 0.2 },
    priorStrength: 0.9,
    bigBox: true,
  },
  {
    key: "target",
    displayName: "Target",
    domains: ["target.com"],
    nameMatches: ["target"],
    priors: { "5310": 0.85, "5411": 0.15 },
    priorStrength: 0.9,
    bigBox: true,
  },
  {
    key: "costco",
    displayName: "Costco Wholesale",
    domains: ["costco.com"],
    nameMatches: ["costco"],
    // Warehouse dominates by default; the attached fuel station is the minority
    // case. If the caller knows it's the pump, the sub-venue flips it.
    priors: { "5300": 0.9, "5542": 0.1 },
    subVenues: {
      fuel: { "5542": 0.9, "5300": 0.1 },
      warehouse: { "5300": 0.97, "5542": 0.03 },
    },
    priorStrength: 0.9,
    bigBox: true,
    composite: true,
    // Costco US warehouses accept Visa only (illustrative acceptance rule).
    acceptedNetworks: ["visa"],
  },

  // ---- Clean single-MCC merchants ------------------------------------------
  {
    key: "safeway",
    displayName: "Safeway",
    domains: ["safeway.com"],
    nameMatches: ["safeway"],
    // A straightforward supermarket: high curation confidence, one dominant MCC.
    priors: { "5411": 0.97, "5499": 0.03 },
    priorStrength: 0.96,
  },

  // ---- Host venues (host-bleed) --------------------------------------------
  {
    key: "marriott",
    displayName: "Marriott Hotel",
    domains: ["marriott.com"],
    nameMatches: ["marriott", "hotel", "resort", "inn & suites"],
    // Sundry-shop candy, minibar, etc. tend to code as the hotel itself.
    priors: { "7011": 0.85, "5999": 0.1, "5812": 0.05 },
    subVenues: {
      // A clearly separate restaurant folio can code as dining.
      restaurant: { "5812": 0.85, "7011": 0.15 },
    },
    priorStrength: 0.9,
    hostVenue: true,
  },

  // ---- Composite gas + QSR --------------------------------------------------
  {
    key: "mobil_bk",
    displayName: "Mobil + Burger King (truck stop)",
    // "mobil" must be a whole token — bare substring matching falsely claims
    // BELL/ROGERS/TELUS MOBILITY, MOBILE …, and AUTOMOBILE as gas/QSR.
    // "exxonmobil" is one token so it is listed explicitly. Bare "burger king"
    // on this composite is a separate known issue (standalone QSR → gas).
    nameMatches: ["mobil", "exxonmobil", "burger king", "travel center", "truck stop"],
    // Genuine coin-flip: pay at the pump (gas) vs go inside for food (fast food).
    // Slight default tilt to the pump.
    priors: { "5542": 0.55, "5814": 0.45 },
    subVenues: {
      fuel: { "5542": 0.92, "5814": 0.08 },
      restaurant: { "5814": 0.92, "5542": 0.08 },
    },
    priorStrength: 0.85,
    composite: true,
  },

  // ---- Mobile / while-traveling --------------------------------------------
  {
    key: "food_truck",
    displayName: "Street food truck",
    nameMatches: ["food truck", "taco truck", "farmers market", "pop-up", "popup"],
    // Frequently codes convenience/misc rather than the "expected" dining MCC.
    priors: { "5499": 0.5, "5814": 0.3, "5999": 0.2 },
    priorStrength: 0.5,
    mobileVendor: true,
  },
];

interface MerchantIndex {
  byKey: Map<string, MerchantEntry>;
  byDomain: Map<string, MerchantEntry>;
}

function buildIndex(entries: MerchantEntry[]): MerchantIndex {
  const byKey = new Map<string, MerchantEntry>();
  const byDomain = new Map<string, MerchantEntry>();
  for (const e of entries) {
    byKey.set(e.key, e);
    for (const d of e.domains ?? []) byDomain.set(d.toLowerCase(), e);
  }
  return { byKey, byDomain };
}

const INDEX = buildIndex(MERCHANTS);

/** Normalize a domain like "https://www.walmart.com/cart" → "walmart.com". */
export function normalizeDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0] ?? d;
  // Collapse to the registrable-ish domain (last two labels). Good enough for
  // curated V1; a real impl would use a public-suffix list.
  const labels = d.split(".");
  if (labels.length > 2) return labels.slice(-2).join(".");
  return d;
}

/**
 * Match a curated name fragment against a merchant descriptor.
 *
 * Multi-word / punctuated fragments keep substring includes (e.g. "burger king",
 * "wal-mart", "inn & suites"). Single-token fragments require a whole-token
 * match so short brands like "mobil" / "target" cannot steal "mobility",
 * "mobile", "automobile", or "targeted …".
 */
export function nameFragmentMatches(merchantName: string, fragment: string): boolean {
  const name = merchantName.toLowerCase();
  const frag = fragment.toLowerCase();
  if (!frag) return false;
  if (/[^a-z0-9]/.test(frag)) return name.includes(frag);
  const pattern = new RegExp(`(?:^|[^a-z0-9])${frag}(?:[^a-z0-9]|$)`);
  return pattern.test(name);
}

export interface MerchantResolution {
  entry: MerchantEntry;
  /** How we matched — recorded in signalsUsed for explainability. */
  via: "key" | "domain" | "name";
}

/**
 * Resolve a merchant from any combination of key / domain / name. Returns
 * undefined for unknown merchants (the caller then fails safe to low confidence).
 */
export function resolveMerchant(input: {
  merchantKey?: string;
  domain?: string;
  merchantName?: string;
}): MerchantResolution | undefined {
  if (input.merchantKey) {
    const entry = INDEX.byKey.get(input.merchantKey);
    if (entry) return { entry, via: "key" };
  }
  if (input.domain) {
    const entry = INDEX.byDomain.get(normalizeDomain(input.domain));
    if (entry) return { entry, via: "domain" };
  }
  if (input.merchantName) {
    const name = input.merchantName.toLowerCase();
    for (const entry of MERCHANTS) {
      if (entry.nameMatches?.some((frag) => nameFragmentMatches(name, frag))) {
        return { entry, via: "name" };
      }
    }
  }
  return undefined;
}
