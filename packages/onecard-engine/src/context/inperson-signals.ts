/**
 * In-person signal extraction — V2, STUBBED.
 *
 * The interface is defined now so predict.ts can consume in-person signals the
 * same way it consumes online ones once this is built. In V2 this would take
 * geolocation, the POS/terminal merchant name, possibly a Plaid/issuer feed of
 * the *previous* transaction's MCC at this merchant, etc., and resolve a
 * merchant + sub-venue.
 *
 * Like online signals, anything produced here is only ever an input to the
 * MCC prior — never a money-movement instruction. This module stays advice-only.
 */

import type { Category } from "../mcc/mcc-catalog.js";

/** Raw in-person context. All optional; V2 will populate these. */
export interface InPersonInput {
  /** Name as printed on the terminal / receipt header. */
  terminalMerchantName?: string;
  /** Coarse location, used only to disambiguate merchants. */
  location?: { lat: number; lng: number };
  /** Reverse-geocoded place name / category from a maps provider. */
  placeName?: string;
  placeTypes?: string[];
  /** Sub-venue hint if the host app can tell (e.g. "fuel" vs "store"). */
  subVenue?: string;
}

export interface InPersonSignals {
  merchantName?: string;
  subVenue?: string;
  /** Same ranked-hint shape as online signals, for a shared predict path. */
  itemHints: Category[][];
  notes: string[];
}

/**
 * Stub: echoes through the few fields a V1 caller might already have, and marks
 * that real in-person inference is not implemented. Intentionally produces no
 * item hints — V1 has no in-person cart visibility.
 */
export function extractInPersonSignals(input: InPersonInput): InPersonSignals {
  return {
    merchantName: input.terminalMerchantName ?? input.placeName,
    subVenue: input.subVenue,
    itemHints: [],
    notes: ["in-person signal extraction is a V2 stub"],
  };
}
