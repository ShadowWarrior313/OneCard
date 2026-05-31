/**
 * Single source of truth for Canadian credit card reward rates used by the simulator.
 * Reward value is normalized via pointValueCAD so points and cashback compare in dollars.
 */
import type { CardNetwork, CardProduct, RewardCategory, RewardRule } from "@onecard/shared-types";
import { formatPercent } from "@/lib/formatNumber";
import { AMEX_GROCERY_EXCLUSIONS } from "./merchantPartners";
import legacySnapshot from "./cardRewards.snapshot.json";
import catalogAdditions from "./cardCatalogAdditions.json";

/** Category keys aligned with simulator MCC buckets. */
export type CardRewardCategoryKey =
  | "dining"
  | "groceries"
  | "gas"
  | "travel"
  | "subscriptions"
  | "entertainment"
  | "transportation"
  | "drugstore"
  | "recurring_bills"
  | "other";

export type CapPeriod = "monthly" | "annual" | null;

export interface CategoryCap {
  maxSpend: number;
  period: CapPeriod;
  /** Track spend across categories on one card (e.g. RBC Ion combined bonus cap). */
  sharedCapGroup?: string;
}

export interface CategoryReward {
  /** Points or % per dollar in the card's native earn unit. */
  earnRate: number;
  cap?: CategoryCap | null;
  note?: string;
  merchantIds?: string[];
  excludedMerchantIds?: string[];
}

export interface CardRewardConfig {
  id: string;
  issuer: string;
  name: string;
  annualFee?: number;
  network: CardNetwork;
  /** Cash value of one point/mile (cashback cards use 0.01 = 1%). */
  pointValueCAD: number;
  /** Display label for earn unit in UI copy. */
  currency: string;
  ratesAsOf: string;
  /** Official issuer rewards page — verify rates before relying on estimates. */
  sourceUrl: string;
  categories: Partial<Record<CardRewardCategoryKey, CategoryReward>>;
  /** Merchant-scoped earn rules that don't fit the flat category map. */
  merchantRules?: RewardRule[];
  /** When true, rates need manual verification against sourceUrl. */
  needsVerification?: boolean;
}

export interface CardMeta {
  cardId: string;
  issuer: string;
  displayName: string;
}

const CATEGORY_KEY_TO_REWARD: Record<CardRewardCategoryKey, RewardCategory> = {
  dining: "dining",
  groceries: "groceries",
  gas: "gas",
  travel: "travel",
  subscriptions: "streaming",
  entertainment: "entertainment",
  transportation: "transportation",
  drugstore: "drugstore",
  recurring_bills: "recurring_bills",
  other: "other",
};

const REWARD_TO_CATEGORY_KEY: Partial<Record<RewardCategory, CardRewardCategoryKey>> = {
  dining: "dining",
  groceries: "groceries",
  gas: "gas",
  travel: "travel",
  streaming: "subscriptions",
  entertainment: "entertainment",
  transportation: "transportation",
  drugstore: "drugstore",
  recurring_bills: "recurring_bills",
  other: "other",
};

function capFromRule(rule: RewardRule): CategoryCap | null {
  if (rule.capMonthly != null) {
    return {
      maxSpend: rule.capMonthly,
      period: "monthly",
      sharedCapGroup: rule.sharedCapGroup,
    };
  }
  if (rule.capAnnual != null) {
    return {
      maxSpend: rule.capAnnual,
      period: "annual",
      sharedCapGroup: rule.sharedCapGroup,
    };
  }
  return null;
}

function capToRuleFields(
  cap?: CategoryCap | null,
): Partial<Pick<RewardRule, "capMonthly" | "capAnnual" | "sharedCapGroup">> {
  if (!cap || cap.period == null) return {};
  const sharedCapGroup = cap.sharedCapGroup;
  if (cap.period === "monthly") {
    return { capMonthly: cap.maxSpend, sharedCapGroup };
  }
  return { capAnnual: cap.maxSpend, sharedCapGroup };
}

/** Convert legacy RewardRule[] into a categories map (non-merchant rules only). */
export function rewardRulesToCategories(
  rules: RewardRule[],
): Partial<Record<CardRewardCategoryKey, CategoryReward>> {
  const categories: Partial<Record<CardRewardCategoryKey, CategoryReward>> = {};
  for (const rule of rules) {
    if (rule.merchantIds?.length) continue;
    const key = REWARD_TO_CATEGORY_KEY[rule.category];
    if (!key) continue;
    if (rule.excludedMerchantIds?.length && categories[key]) continue;
    categories[key] = {
      earnRate: rule.multiplier,
      cap: capFromRule(rule),
      excludedMerchantIds: rule.excludedMerchantIds,
      note: rule.excludedMerchantIds?.length
        ? "Exclusions apply at select merchants."
        : undefined,
    };
  }
  return categories;
}

/** Flatten CardRewardConfig into engine RewardRule[]. */
export function categoriesToRewardRules(config: CardRewardConfig): RewardRule[] {
  const rules: RewardRule[] = [];

  for (const [key, reward] of Object.entries(config.categories) as [
    CardRewardCategoryKey,
    CategoryReward,
  ][]) {
    if (!reward) continue;
    const category = CATEGORY_KEY_TO_REWARD[key];
    rules.push({
      category,
      multiplier: reward.earnRate,
      ...capToRuleFields(reward.cap),
      merchantIds: reward.merchantIds,
      excludedMerchantIds: reward.excludedMerchantIds,
    });
  }

  if (config.merchantRules?.length) {
    rules.push(...config.merchantRules);
  }

  if (!rules.some((r) => r.category === "other" && !r.merchantIds?.length)) {
    rules.push({ category: "other", multiplier: 1 });
  }

  return rules;
}

export function cardRewardConfigToProduct(
  meta: CardMeta,
  config: CardRewardConfig,
): CardProduct {
  return {
    cardId: meta.cardId,
    issuer: meta.issuer,
    displayName: meta.displayName,
    annualFee: config.annualFee,
    currency: config.currency,
    pointValueCents: Math.round(config.pointValueCAD * 10000) / 100,
    network: config.network,
    rewards: categoriesToRewardRules(config),
  };
}

/** Wallet default cards — researched against issuer pages (Jan 2026). */
const WALLET_SEED_CARD_CONFIGS: CardRewardConfig[] = [
  {
    id: "amex_cobalt",
    issuer: "American Express",
    name: "American Express Cobalt Card",
    annualFee: 155.88,
    network: "amex",
    pointValueCAD: 0.02, // TODO: verify — MR valuation varies by redemption (~1.7–2.2¢)
    currency: "MR points",
    ratesAsOf: "2026-01-15",
    sourceUrl:
      "https://www.americanexpress.com/ca/en/credit-cards/cobalt-card/",
    categories: {
      groceries: {
        earnRate: 5,
        cap: { maxSpend: 2500, period: "monthly" },
        excludedMerchantIds: [...AMEX_GROCERY_EXCLUSIONS],
        note: "5× at eligible grocers; Loblaw banners, Costco, Walmart grocery excluded.",
      },
      dining: {
        earnRate: 5,
        cap: { maxSpend: 2500, period: "monthly" },
        note: "5× on eligible food & drink including delivery.",
      },
      subscriptions: {
        earnRate: 3,
        note: "3× on eligible streaming subscriptions.",
      },
      travel: { earnRate: 1 },
      gas: { earnRate: 1 },
      entertainment: { earnRate: 1 },
      transportation: { earnRate: 1 },
      drugstore: { earnRate: 1 },
      recurring_bills: { earnRate: 1 },
      other: { earnRate: 1 },
    },
  },
  {
    id: "cibc_dividend_infinite",
    issuer: "CIBC",
    name: "CIBC Dividend Visa Infinite Card",
    annualFee: 120,
    network: "visa",
    pointValueCAD: 0.01,
    currency: "cashback %",
    ratesAsOf: "2026-01-15",
    sourceUrl:
      "https://www.cibc.com/en/personal-banking/credit-cards/all-credit-cards/dividend-visa-infinite-card.html",
    categories: {
      gas: {
        earnRate: 4,
        cap: {
          maxSpend: 80,
          period: "monthly",
          sharedCapGroup: "cibc_div_inf_gas_transit",
        },
        note: "4% on gas and EV charging; first $80/mo in gas+transit bucket.",
      },
      groceries: {
        earnRate: 2,
        cap: { maxSpend: 80, period: "monthly" },
        note: "2% on groceries; bonus applies to first $80 spend per billing period.",
      },
      recurring_bills: {
        earnRate: 2,
        cap: { maxSpend: 80, period: "monthly" },
        note: "2% on recurring bill payments; bonus applies to first $80 spend per billing period.",
      },
      dining: { earnRate: 1 },
      travel: { earnRate: 1 },
      subscriptions: { earnRate: 1 },
      entertainment: { earnRate: 1 },
      transportation: {
        earnRate: 4,
        cap: {
          maxSpend: 80,
          period: "monthly",
          sharedCapGroup: "cibc_div_inf_gas_transit",
        },
        note: "TODO: verify — public transit may share the $80/mo gas+transit bonus bucket.",
      },
      drugstore: { earnRate: 1 },
      other: { earnRate: 1 },
    },
  },
  {
    id: "scotia_momentum",
    issuer: "Scotiabank",
    name: "Scotia Momentum Visa Infinite Card",
    annualFee: 120,
    network: "visa",
    pointValueCAD: 0.01,
    currency: "cashback %",
    ratesAsOf: "2026-01-15",
    sourceUrl:
      "https://www.scotiabank.com/ca/en/personal/credit-cards/visa/momentum-infinite-card.html",
    categories: {
      groceries: {
        earnRate: 4,
        cap: { maxSpend: 250, period: "monthly" },
        note: "4% on grocery purchases.",
      },
      recurring_bills: {
        earnRate: 4,
        cap: { maxSpend: 250, period: "monthly" },
        note: "4% on recurring bill payments (phone, internet, utilities, etc.).",
      },
      gas: { earnRate: 2 },
      dining: { earnRate: 1 },
      travel: { earnRate: 1 },
      subscriptions: { earnRate: 1 },
      entertainment: { earnRate: 1 },
      transportation: { earnRate: 1 },
      drugstore: { earnRate: 1 },
      other: { earnRate: 1 },
    },
  },
  {
    id: "rbc_ion",
    issuer: "RBC",
    name: "RBC Ion Visa Card",
    annualFee: 0,
    network: "visa",
    pointValueCAD: 0.014, // TODO: verify — Avion pts valuation depends on redemption
    currency: "Avion points",
    ratesAsOf: "2026-01-15",
    sourceUrl: "https://www.rbcroyalbank.com/credit-cards/avion/ion-visa.html",
    categories: {
      groceries: {
        earnRate: 3,
        cap: {
          maxSpend: 500,
          period: "monthly",
          sharedCapGroup: "rbc_ion_bonus",
        },
        note: "3× on groceries; shares combined $500/mo bonus cap with other 3× categories.",
      },
      gas: {
        earnRate: 3,
        cap: {
          maxSpend: 500,
          period: "monthly",
          sharedCapGroup: "rbc_ion_bonus",
        },
      },
      dining: {
        earnRate: 3,
        cap: {
          maxSpend: 500,
          period: "monthly",
          sharedCapGroup: "rbc_ion_bonus",
        },
      },
      subscriptions: {
        earnRate: 3,
        cap: {
          maxSpend: 500,
          period: "monthly",
          sharedCapGroup: "rbc_ion_bonus",
        },
        note: "Includes eligible streaming and digital subscriptions.",
      },
      transportation: {
        earnRate: 3,
        cap: {
          maxSpend: 500,
          period: "monthly",
          sharedCapGroup: "rbc_ion_bonus",
        },
        note: "TODO: verify EV charging eligibility in bonus bucket.",
      },
      travel: { earnRate: 1 },
      entertainment: { earnRate: 1 },
      drugstore: { earnRate: 1 },
      recurring_bills: { earnRate: 1 },
      other: { earnRate: 1 },
    },
  },
];

type LegacySnapshotEntry = {
  id: string;
  issuer: string;
  name: string;
  annualFee?: number;
  network: CardNetwork;
  pointValueCAD: number;
  currency: string;
  ratesAsOf: string;
  sourceUrl: string;
  verify?: boolean;
  rewards: RewardRule[];
};

function legacyEntryToConfig(entry: LegacySnapshotEntry): CardRewardConfig {
  const merchantRules = entry.rewards.filter((r) => r.merchantIds?.length);
  return {
    id: entry.id,
    issuer: entry.issuer,
    name: entry.name,
    annualFee: entry.annualFee,
    network: entry.network,
    pointValueCAD: entry.pointValueCAD,
    currency: entry.currency,
    ratesAsOf: entry.ratesAsOf,
    sourceUrl: entry.sourceUrl,
    categories: rewardRulesToCategories(entry.rewards),
    merchantRules: merchantRules.length ? merchantRules : undefined,
    needsVerification: entry.verify ?? true,
  };
}

type CatalogAddition = {
  id: string;
  issuer: string;
  name: string;
  network: CardNetwork;
  sourceUrl: string;
  scrapedAt: string;
};

function catalogAdditionToFallbackConfig(entry: CatalogAddition): CardRewardConfig {
  return {
    id: entry.id,
    issuer: entry.issuer,
    name: entry.name,
    network: entry.network,
    pointValueCAD: 0.01,
    currency: "issuer rewards",
    ratesAsOf: entry.scrapedAt,
    sourceUrl: entry.sourceUrl,
    categories: {
      other: { earnRate: 1, note: "Conservative fallback until issuer earn rates are normalized." },
    },
    needsVerification: true,
  };
}

const SEED_IDS = new Set(WALLET_SEED_CARD_CONFIGS.map((c) => c.id));

function buildCardRewardRegistry(): Record<string, CardRewardConfig> {
  const registry: Record<string, CardRewardConfig> = {};

  for (const config of WALLET_SEED_CARD_CONFIGS) {
    registry[config.id] = config;
  }

  for (const entry of legacySnapshot as LegacySnapshotEntry[]) {
    if (SEED_IDS.has(entry.id)) continue;
    registry[entry.id] = legacyEntryToConfig(entry);
  }

  for (const entry of catalogAdditions as CatalogAddition[]) {
    registry[entry.id] ??= catalogAdditionToFallbackConfig(entry);
  }

  return registry;
}

export const CARD_REWARD_CONFIGS: Record<string, CardRewardConfig> =
  buildCardRewardRegistry();

export function getCardRewardConfig(cardId: string): CardRewardConfig | undefined {
  return CARD_REWARD_CONFIGS[cardId];
}

export function applyCardRewards(meta: CardMeta): CardProduct {
  const config = getCardRewardConfig(meta.cardId);
  if (!config) {
    throw new Error(
      `Missing cardRewards config for "${meta.cardId}". Add an entry in src/data/cardRewards.ts.`,
    );
  }
  return cardRewardConfigToProduct(meta, config);
}

/** Newest ratesAsOf across all configured cards (for simulator disclaimer). */
export function getNewestRatesAsOf(): string {
  let newest = "";
  for (const config of Object.values(CARD_REWARD_CONFIGS)) {
    if (config.ratesAsOf > newest) newest = config.ratesAsOf;
  }
  return newest || "2026-01-15";
}

export function formatRatesDisclaimer(): string {
  const date = getNewestRatesAsOf();
  const formatted = new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `Rates as of ${formatted} — verify with your issuer.`;
}

/** Effective cashback % for display (normalized dollars / spend). */
export function effectiveRewardPercent(
  rewardValueCents: number,
  spendDollars: number,
): number {
  if (spendDollars <= 0) return 0;
  return (rewardValueCents / 100 / spendDollars) * 100;
}

export function formatEffectiveRewardPercent(
  rewardValueCents: number,
  spendDollars: number,
): string {
  return `${formatPercent(effectiveRewardPercent(rewardValueCents, spendDollars))} back`;
}
