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

function bestMultiplier(rules: RewardRule[]): RewardRule {
  return rules.reduce((best, rule) =>
    rule.multiplier > best.multiplier ? rule : best,
  );
}

/**
 * Best matching rule for a transaction:
 * 1. Merchant-specific rules whose category matches the spend category
 * 2. Merchant-specific `other` catch-all at that merchant (store-wide partner earn)
 * 3. Category rules (no merchantIds) that match category and aren't excluded
 * 4. `other` fallback, else synthetic 1x
 *
 * Merchant rules must be category-aware: cards like CIBC Costco declare both a
 * gas@3× Costco rule and an other@2× Costco rule. Picking the max multiplier
 * across all merchantIds matches would score every Costco warehouse purchase
 * at the gas rate.
 */
export function getRewardRule(
  card: CardProduct,
  category: RewardCategory,
  merchantId?: string,
): RewardRule {
  if (merchantId) {
    const merchantRules = card.rewards.filter(
      (rule) => rule.merchantIds?.length && rule.merchantIds.includes(merchantId),
    );

    const categoryMatch = merchantRules.filter((rule) => rule.category === category);
    if (categoryMatch.length) {
      return bestMultiplier(categoryMatch);
    }

    // Store-wide partner earn (e.g. PC at Shoppers, Scene+ at Cineplex) is
    // modeled as category "other" with merchantIds — apply when no tighter
    // category-specific merchant rule exists.
    if (category !== "other") {
      const merchantOther = merchantRules.filter((rule) => rule.category === "other");
      if (merchantOther.length) {
        return bestMultiplier(merchantOther);
      }
    }
  }

  const categoryRules = card.rewards.filter(
    (rule) =>
      !rule.merchantIds?.length &&
      rule.category === category &&
      ruleMatchesMerchant(rule, merchantId),
  );
  if (categoryRules.length) {
    return bestMultiplier(categoryRules);
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
