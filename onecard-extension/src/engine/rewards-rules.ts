export type RewardCategory =
  | "groceries"
  | "dining"
  | "gas"
  | "travel"
  | "streaming"
  | "recurring_bills"
  | "entertainment"
  | "transportation"
  | "drugstore"
  | "electronics"
  | "retail"
  | "other";

export type CardNetwork = "visa" | "mastercard" | "amex" | "discover";

export type RewardRule = {
  category: RewardCategory;
  rate: number;
  unit: "x" | "%";
  cap?: {
    amount: number;
    period: "monthly" | "annual";
    note: string;
  };
  /** Merchants where this category bonus does not apply (issuer exclusions). */
  excludedMerchantIds?: string[];
  note?: string;
};

/** Merchant payment-network restrictions (issuer / retailer acceptance). */
export const MERCHANT_ACCEPTED_NETWORKS: Record<string, CardNetwork[]> = {
  loblaws: ["visa", "mastercard"],
  no_frills: ["visa", "mastercard"],
  superstore: ["visa", "mastercard"],
  food_basics: ["visa", "mastercard"],
  costco: ["mastercard"],
  save_on_foods: ["visa", "mastercard"],
};

/** Amex Cobalt grocery exclusions (extension merchant ids). */
export const AMEX_GROCERY_EXCLUSIONS = [
  "loblaws",
  "no_frills",
  "superstore",
  "food_basics",
  "costco",
  "save_on_foods",
  "walmart",
] as const;

export type StoreOfferRule = {
  merchantId: string;
  cardId: string;
  bonusRate: number;
  unit: "x" | "%";
  note: string;
};

export type LinkedCard = {
  id: string;
  displayName: string;
  issuer: string;
  network: CardNetwork;
  rewardUnit: string;
  pointValueCents: number;
  rules: RewardRule[];
};

export const CATEGORY_LABELS: Record<RewardCategory, string> = {
  groceries: "groceries",
  dining: "dining",
  gas: "gas",
  travel: "travel",
  streaming: "streaming",
  recurring_bills: "recurring bills",
  entertainment: "entertainment",
  transportation: "transportation",
  drugstore: "drugstore",
  electronics: "electronics",
  retail: "retail",
  other: "other purchases",
};

export const MCC_CATEGORY_MAP: Record<string, RewardCategory> = {
  "3000": "travel",
  "4111": "transportation",
  "4121": "transportation",
  "4722": "travel",
  "4814": "recurring_bills",
  "4900": "recurring_bills",
  "5310": "retail",
  "5311": "retail",
  "5399": "retail",
  "5411": "groceries",
  "5541": "gas",
  "5542": "gas",
  "5732": "electronics",
  "5812": "dining",
  "5814": "dining",
  "5815": "streaming",
  "5816": "entertainment",
  "5912": "drugstore",
  "5942": "retail",
  "5999": "other",
  "7011": "travel",
  "7832": "entertainment",
  "7922": "entertainment",
};

export const STORE_OFFER_RULES: StoreOfferRule[] = [
  {
    merchantId: "walmart",
    cardId: "bmo_cashback_world_elite",
    bonusRate: 5,
    unit: "%",
    note: "Example store offer slot: BMO grocery bonus at Walmart-coded grocery checkout.",
  },
];

export function categoryForMcc(mcc: string): RewardCategory {
  return MCC_CATEGORY_MAP[mcc] ?? "other";
}

export function isCardAcceptedAtMerchant(
  card: LinkedCard,
  merchantId?: string,
): boolean {
  if (!merchantId || !card.network) return true;
  const accepted = MERCHANT_ACCEPTED_NETWORKS[merchantId];
  if (!accepted) return true;
  return accepted.includes(card.network);
}

export function rewardRuleFor(
  card: LinkedCard,
  category: RewardCategory,
  merchantId?: string,
): RewardRule {
  const fallback =
    card.rules.find((rule) => rule.category === "other") ?? {
      category: "other" as const,
      rate: 1,
      unit: "x" as const,
    };
  const rule = card.rules.find((candidate) => candidate.category === category);
  if (!rule) return fallback;
  if (merchantId && rule.excludedMerchantIds?.includes(merchantId)) {
    return fallback;
  }
  return rule;
}

export function normalizedCashbackPercent(card: LinkedCard, rule: RewardRule): number {
  if (rule.unit === "%") return rule.rate;
  return rule.rate * (card.pointValueCents / 100);
}
