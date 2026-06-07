/**
 * Canonical MCC (ISO 18245 Merchant Category Code) catalog.
 *
 * Each entry maps an MCC to a human label and a *canonical* reward category.
 * "Canonical" is the global default mapping — but note: real cards bucket MCCs
 * into their own reward categories differently (e.g. some programs count 5814
 * "fast food" as dining, some don't). That per-program nuance lives in
 * rewards-rules.ts; this file is only the global fallback / display layer.
 *
 * This is curated data, not a live feed. Add codes here as the wallet grows.
 */

/**
 * Normalized reward category. Cards may relabel these per program, but this is
 * the engine's shared vocabulary for MCC → category and for explanations.
 */
export type Category =
  | "groceries"
  | "dining"
  | "fast_food"
  | "gas"
  | "lodging"
  | "travel"
  | "convenience"
  | "wholesale"
  | "discount" // big-box discount / general merchandise (Walmart, Target)
  | "department"
  | "books"
  | "electronics"
  | "drugstore"
  | "beauty"
  | "misc_retail" // 5999 and other catch-all retail
  | "other";

export interface MccEntry {
  mcc: string;
  label: string;
  /** Global default category. Cards may override per program. */
  category: Category;
}

/**
 * Sentinel MCC used when we genuinely cannot guess the code (unknown
 * merchant). It maps to "other" so every card earns only its base rate on it —
 * which makes a strong catch-all card win, exactly the fail-safe behaviour we
 * want when we have no signal.
 */
export const UNKNOWN_MCC = "0000";

const CATALOG_ENTRIES: MccEntry[] = [
  { mcc: UNKNOWN_MCC, label: "Unknown / unclassified merchant", category: "other" },

  // Grocery & food retail
  { mcc: "5411", label: "Grocery stores & supermarkets", category: "groceries" },
  { mcc: "5499", label: "Misc. food stores / convenience", category: "convenience" },
  { mcc: "5451", label: "Dairy product stores", category: "groceries" },

  // Dining
  { mcc: "5812", label: "Eating places & restaurants", category: "dining" },
  { mcc: "5813", label: "Drinking places (bars, lounges)", category: "dining" },
  { mcc: "5814", label: "Fast food restaurants", category: "fast_food" },

  // Fuel
  { mcc: "5541", label: "Service stations (with/without ancillary)", category: "gas" },
  { mcc: "5542", label: "Automated fuel dispensers", category: "gas" },

  // Lodging & travel
  { mcc: "7011", label: "Hotels, motels & resorts", category: "lodging" },
  { mcc: "7512", label: "Automobile rental agency", category: "travel" },
  { mcc: "4411", label: "Cruise lines", category: "travel" },
  { mcc: "4722", label: "Travel agencies & tour operators", category: "travel" },
  // Airlines occupy the 3000–3299 range; represented by a marker entry.
  { mcc: "3000", label: "Airlines (carrier-specific 3000–3299)", category: "travel" },

  // Big-box / general merchandise
  { mcc: "5300", label: "Wholesale clubs", category: "wholesale" },
  { mcc: "5310", label: "Discount stores", category: "discount" },
  { mcc: "5311", label: "Department stores", category: "department" },
  { mcc: "5399", label: "Misc. general merchandise", category: "discount" },

  // Specialty retail
  { mcc: "5732", label: "Electronics stores", category: "electronics" },
  { mcc: "5942", label: "Book stores", category: "books" },
  { mcc: "5912", label: "Drug stores & pharmacies", category: "drugstore" },
  { mcc: "5977", label: "Cosmetic stores", category: "beauty" },
  { mcc: "5999", label: "Misc. & specialty retail", category: "misc_retail" },
];

/** Indexed by MCC for O(1) lookup. */
const CATALOG: Map<string, MccEntry> = new Map(
  CATALOG_ENTRIES.map((e) => [e.mcc, e]),
);

/** Look up a catalog entry, falling back to the UNKNOWN sentinel. */
export function lookupMcc(mcc: string): MccEntry {
  return CATALOG.get(mcc) ?? CATALOG.get(UNKNOWN_MCC)!;
}

/** Human label for an MCC (for explanations / debugging). */
export function labelForMcc(mcc: string): string {
  return lookupMcc(mcc).label;
}

/**
 * Global default category for an MCC. Airlines (3000–3299) collapse to travel.
 * This is the fallback used when a card's program declares no override.
 */
export function categoryForMcc(mcc: string): Category {
  const code = parseInt(mcc, 10);
  if (!Number.isNaN(code) && code >= 3000 && code <= 3299) return "travel";
  return lookupMcc(mcc).category;
}

/** All known MCCs (handy for tests / tooling). */
export function allMccs(): readonly MccEntry[] {
  return CATALOG_ENTRIES;
}
