import type { CardNetwork, CardProduct } from "@onecard/shared-types";

/**
 * Infer the payment network from an official product name when the name
 * unambiguously names one network (e.g. "World Elite Mastercard", "Visa Infinite").
 * Returns undefined when the name is silent or mentions more than one network.
 */
export function networkFromProductName(name: string): CardNetwork | undefined {
  const n = name.toLowerCase();
  const matches: CardNetwork[] = [];
  if (/\bmastercard\b/.test(n)) matches.push("mastercard");
  if (/\bvisa\b/.test(n)) matches.push("visa");
  if (/\bamerican express\b|\bamex\b/.test(n)) matches.push("amex");
  if (/\bdiscover\b/.test(n)) matches.push("discover");
  return matches.length === 1 ? matches[0] : undefined;
}

/** Prefer the network stated in the product name over a contradictory declared value. */
export function resolveCardNetwork(
  name: string,
  declared?: CardNetwork,
): CardNetwork | undefined {
  return networkFromProductName(name) ?? declared;
}

/** Merchant payment restrictions — sourced from issuer / retailer acceptance policies. */
export const MERCHANT_ACCEPTED_NETWORKS: Record<string, CardNetwork[]> = {
  // Loblaws banners — no Amex (promotes PC Financial Mastercard)
  loblaws: ["visa", "mastercard"],
  no_frills: ["visa", "mastercard"],
  superstore: ["visa", "mastercard"],
  food_basics: ["visa", "mastercard"],
  // Costco in-store — Mastercard only
  costco: ["mastercard"],
  costco_wholesale: ["mastercard"],
  // Western Canada chain — Visa / Mastercard only
  save_on_foods: ["visa", "mastercard"],
};

export function isCardAcceptedAtMerchant(
  card: CardProduct,
  merchantId?: string,
): boolean {
  if (!merchantId || !card.network) return true;
  const accepted = MERCHANT_ACCEPTED_NETWORKS[merchantId];
  if (!accepted) return true;
  return accepted.includes(card.network);
}
