import type { CardNetwork, CardProduct } from "@onecard/shared-types";

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
