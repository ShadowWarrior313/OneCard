import type { RewardCategory } from "@onecard/shared-types";
import { mapMccToCategory } from "./mapMccToCategory.js";

/**
 * Resolve spend category — merchant catalog category wins when provided,
 * since MCC codes are often wrong (Costco 5300, utilities 4900, etc.).
 */
export function resolveCategory(
  mcc: string,
  merchantCategory?: RewardCategory,
): RewardCategory {
  if (merchantCategory) return merchantCategory;
  return mapMccToCategory(mcc);
}
