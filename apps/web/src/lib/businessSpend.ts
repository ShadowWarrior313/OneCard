/** Merchants that should not be charged to a business-designated card. */
export const BUSINESS_BLOCKED_MERCHANT_IDS = new Set([
  "netflix",
  "spotify",
  "cineplex",
  "tim_hortons",
]);

export type PurchaseType = "personal" | "business";

export function isBusinessMerchantAllowed(merchantId: string): boolean {
  return !BUSINESS_BLOCKED_MERCHANT_IDS.has(merchantId);
}

export function businessRoutingExclusions(
  cardIds: string[],
  businessCardId: string | undefined,
  purchaseType: PurchaseType,
): string[] | undefined {
  if (purchaseType !== "business" || !businessCardId) return undefined;
  return cardIds.filter((id) => id !== businessCardId);
}
