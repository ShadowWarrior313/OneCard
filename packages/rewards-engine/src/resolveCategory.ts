import type { RewardCategory } from "@onecard/shared-types";
import { mapMccToCategory } from "./mapMccToCategory.js";

/**
 * Issuers almost never distinguish "fine dining" from dining for earn rates.
 * Catalogs may label steakhouses as fine_dining for UX, but card programs
 * pay the dining multiplier (Cobalt 5×, etc.). Collapsing here prevents the
 * router from falling through to `other` / base rate and picking the wrong card.
 */
export function normalizeRewardCategory(category: RewardCategory): RewardCategory {
  if (category === "fine_dining") return "dining";
  return category;
}

/**
 * Resolve spend category — merchant catalog category wins when provided,
 * since MCC codes are often wrong (Costco 5300, utilities 4900, etc.).
 */
export function resolveCategory(
  mcc: string,
  merchantCategory?: RewardCategory,
): RewardCategory {
  if (merchantCategory) return normalizeRewardCategory(merchantCategory);
  return mapMccToCategory(mcc);
}
