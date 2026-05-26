import type { CardProduct, RewardCategory } from "@onecard/shared-types";
import { getRewardRule } from "@onecard/rewards-engine";
import { getCardById } from "@/data/cards";
import { MERCHANT_PRESETS, type MerchantPreset } from "@/data/merchants";

const CATEGORY_LABELS: Record<RewardCategory, string> = {
  groceries: "Groceries",
  dining: "Dining",
  gas: "Gas",
  travel: "Travel",
  streaming: "Streaming",
  recurring_bills: "Bills",
  other: "Other",
};

export function rewardProfile(card: CardProduct) {
  const max = Math.max(...card.rewards.map((r) => r.multiplier), 1);
  return card.rewards.map((rule) => ({
    category: rule.category,
    label: CATEGORY_LABELS[rule.category],
    multiplier: rule.multiplier,
    pct: Math.round((rule.multiplier / max) * 100),
  }));
}

export function topMerchantsForCard(
  cardId: string,
  portfolio: CardProduct[],
  limit = 3,
): { merchant: MerchantPreset; multiplier: number }[] {
  const card = portfolio.find((c) => c.cardId === cardId) ?? getCardById(cardId);
  if (!card) return [];

  const scored = MERCHANT_PRESETS.map((merchant) => {
    const rule = getRewardRule(card, merchant.category, merchant.id);
    return { merchant, multiplier: rule.multiplier };
  })
    .filter((x) => x.multiplier > 1)
    .sort((a, b) => b.multiplier - a.multiplier);

  return scored.slice(0, limit);
}
