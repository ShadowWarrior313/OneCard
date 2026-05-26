import type { CardProduct, RewardCategory, RewardRule } from "@onecard/shared-types";

function ruleMatchesMerchant(
  rule: RewardRule,
  merchantId?: string,
): boolean {
  if (rule.merchantIds?.length) {
    if (!merchantId) return false;
    return rule.merchantIds.includes(merchantId);
  }
  if (merchantId && rule.excludedMerchantIds?.includes(merchantId)) {
    return false;
  }
  return true;
}

/**
 * Best matching rule for a transaction:
 * 1. Merchant-specific rules (merchantIds set) that match
 * 2. Category rules (no merchantIds) that match category and aren't excluded
 * 3. `other` fallback, else synthetic 1x
 */
export function getRewardRule(
  card: CardProduct,
  category: RewardCategory,
  merchantId?: string,
): RewardRule {
  const merchantSpecific = card.rewards.filter(
    (rule) =>
      rule.merchantIds?.length &&
      merchantId &&
      rule.merchantIds.includes(merchantId),
  );
  if (merchantSpecific.length) {
    return merchantSpecific.reduce((best, rule) =>
      rule.multiplier > best.multiplier ? rule : best,
    );
  }

  const categoryRules = card.rewards.filter(
    (rule) =>
      !rule.merchantIds?.length &&
      rule.category === category &&
      ruleMatchesMerchant(rule, merchantId),
  );
  if (categoryRules.length) {
    return categoryRules.reduce((best, rule) =>
      rule.multiplier > best.multiplier ? rule : best,
    );
  }

  const fallback = card.rewards.find(
    (rule) =>
      !rule.merchantIds?.length &&
      rule.category === "other" &&
      ruleMatchesMerchant(rule, merchantId),
  );
  if (fallback) return fallback;

  return { category: "other", multiplier: 1 };
}
