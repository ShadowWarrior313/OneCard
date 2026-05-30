import type { LinkedCard, RewardCategory, RewardRule } from "./rewards-rules";
import {
  CATEGORY_LABELS,
  STORE_OFFER_RULES,
  categoryForMcc,
  normalizedCashbackPercent,
  rewardRuleFor,
} from "./rewards-rules";

export type CardScore = {
  card: LinkedCard;
  rule: RewardRule;
  effectivePercent: number;
  estimatedValue?: number;
  reason: string;
};

export type CartItem = {
  name: string;
  quantity?: number;
  price?: number;
};

export type CheckoutDetectionForScoring = {
  merchant: {
    id: string;
    displayName: string;
    mccCandidates: Array<{
      mcc: string;
      confidence: number;
      reason: string;
    }>;
  };
  cart: {
    items: CartItem[];
    total?: number;
  };
};

export type RecommendationResult = {
  merchantId: string;
  merchantName: string;
  mcc: string;
  mccConfidence: number;
  rewardCategory: RewardCategory;
  cartCategory?: RewardCategory;
  mismatchNote?: string;
  winner: CardScore;
  runnersUp: CardScore[];
  why: string;
  total?: number;
};

function inferCartCategory(items: CartItem[]): RewardCategory | undefined {
  const text = items.map((item) => item.name.toLowerCase()).join(" ");
  if (!text) return undefined;
  if (/\b(razor|toothpaste|shampoo|vitamin|pharmacy|medicine|deodorant)\b/.test(text)) {
    return "drugstore";
  }
  if (/\b(tv|laptop|headphone|monitor|camera|console|keyboard|electronics)\b/.test(text)) {
    return "electronics";
  }
  if (/\b(pizza|coffee|restaurant|burger|sushi)\b/.test(text)) return "dining";
  if (/\b(milk|bread|egg|banana|grocery|produce|cereal)\b/.test(text)) return "groceries";
  if (/\b(toy|shirt|soap|detergent|household|paper towel)\b/.test(text)) return "retail";
  return undefined;
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function scoreCard(
  card: LinkedCard,
  category: RewardCategory,
  total: number | undefined,
  merchantId: string,
): CardScore {
  const baseRule = rewardRuleFor(card, category);
  const offer = STORE_OFFER_RULES.find(
    (rule) => rule.merchantId === merchantId && rule.cardId === card.id,
  );
  const offerRule: RewardRule | undefined = offer
    ? { category, rate: offer.bonusRate, unit: offer.unit, note: offer.note }
    : undefined;
  const basePercent = normalizedCashbackPercent(card, baseRule);
  const offerPercent = offerRule ? normalizedCashbackPercent(card, offerRule) : 0;
  const rule =
    offerRule && offerPercent > basePercent
      ? offerRule
      : baseRule;
  let effectivePercent = normalizedCashbackPercent(card, rule);
  let estimatedValue = total == null ? undefined : (total * effectivePercent) / 100;
  if (total != null && rule.cap && total > rule.cap.amount) {
    const fallbackPercent = normalizedCashbackPercent(card, rewardRuleFor(card, "other"));
    const cappedValue = (rule.cap.amount * effectivePercent) / 100;
    const overageValue = ((total - rule.cap.amount) * fallbackPercent) / 100;
    estimatedValue = cappedValue + overageValue;
    effectivePercent = (estimatedValue / total) * 100;
  }
  const note = `${rule.note ? ` ${rule.note}` : ""}${rule.cap ? ` ${rule.cap.note}` : ""}`;

  return {
    card,
    rule,
    effectivePercent,
    estimatedValue,
    reason: `${card.displayName}: ${rule.rate}${rule.unit} on ${CATEGORY_LABELS[category]}.${note}`,
  };
}

export function scoreRecommendation(
  detection: CheckoutDetectionForScoring,
  wallet: LinkedCard[],
): RecommendationResult | null {
  const primaryMcc = detection.merchant.mccCandidates[0];
  if (!primaryMcc || wallet.length === 0) return null;

  const rewardCategory = categoryForMcc(primaryMcc.mcc);
  const cartCategory = inferCartCategory(detection.cart.items);
  const scores = wallet
    .map((card) =>
      scoreCard(card, rewardCategory, detection.cart.total, detection.merchant.id),
    )
    .sort((a, b) => b.effectivePercent - a.effectivePercent);
  const winner = scores[0];
  if (!winner) return null;

  const mismatchNote =
    cartCategory && cartCategory !== rewardCategory
      ? `Your cart looks like ${CATEGORY_LABELS[cartCategory]}, but rewards post on the merchant category (${CATEGORY_LABELS[rewardCategory]}).`
      : undefined;
  const estimate =
    winner.estimatedValue == null ? "" : ` (+${money(winner.estimatedValue)} est.)`;
  const why = `${detection.merchant.displayName} codes as ${CATEGORY_LABELS[rewardCategory]} to card networks (MCC ${primaryMcc.mcc}), so ${winner.card.displayName} wins with ${winner.rule.rate}${winner.rule.unit}${estimate}.`;

  return {
    merchantId: detection.merchant.id,
    merchantName: detection.merchant.displayName,
    mcc: primaryMcc.mcc,
    mccConfidence: primaryMcc.confidence,
    rewardCategory,
    cartCategory,
    mismatchNote,
    winner,
    runnersUp: scores.slice(1, 4),
    why,
    total: detection.cart.total,
  };
}
