import { predictMcc, type Category as EngineCategory } from "@onecard/onecard-engine";
import type { RewardCategory } from "@onecard/shared-types";
import type { CardRewardCategoryKey } from "@/data/cardRewards";
import { resolveHubMerchant } from "./resolveHubMerchant.ts";

/**
 * Reward-category derivation — the decision layer Plaid does not build.
 *
 * Resolution order:
 *   1. Web merchant catalog brand match (same brands the simulator trusts)
 *   2. MCC engine prediction for the small curated engine catalog
 *   3. Provider budgeting hint when the merchant is unknown (MCC 0000)
 *
 * Without (1)/(3), nearly every real/Plaid/mock merchant collapses to base-rate
 * `other` because the MCC engine only knows ~7 brands and ignores itemHints
 * when the merchant is unknown — so dining/gas/transit/streaming bonuses never
 * surface in hub earned-vs-optimal.
 */
export interface CategorizationCandidate {
  mcc: string;
  label: string;
  category: CardRewardCategoryKey;
  probability: number;
}

export interface CategorizedTransaction {
  category: CardRewardCategoryKey;
  confidence: number;
  confidenceBand: "high" | "medium" | "low";
  ambiguous: boolean;
  candidates: CategorizationCandidate[];
  /** Curated catalog id when brand resolution succeeded (for exclusions). */
  merchantId?: string;
}

export interface CategorizeInput {
  merchantName: string;
  website?: string;
  paymentChannel?: string;
  /** The provider's coarse category. A HINT ONLY — never trusted as the answer. */
  providerCategoryHint?: string;
}

const CATEGORY_MAP: Record<EngineCategory, CardRewardCategoryKey> = {
  groceries: "groceries",
  dining: "dining",
  fast_food: "dining",
  gas: "gas",
  lodging: "travel",
  travel: "travel",
  // Convenience / misc-food (5499) is not issuer "groceries".
  convenience: "other",
  wholesale: "other",
  discount: "other",
  department: "other",
  books: "other",
  electronics: "other",
  drugstore: "drugstore",
  beauty: "other",
  misc_retail: "other",
  other: "other",
};

const PROVIDER_HINTS: Array<[RegExp, EngineCategory[]]> = [
  [/FOOD|DINING|RESTAURANT|FAST_FOOD|COFFEE/, ["dining", "fast_food"]],
  [/GROCERY|SUPERMARKET/, ["groceries"]],
  [/GAS|FUEL/, ["gas"]],
  [/TRAVEL|AIRLINE|HOTEL|LODGING|FLIGHT/, ["travel", "lodging"]],
  [/PHARMACY|DRUGSTORE|MEDICAL/, ["drugstore"]],
  [/ELECTRONICS/, ["electronics"]],
];

/**
 * Direct provider-primary → reward category when the MCC engine has no merchant
 * match. Kept coarser than MCC priors; confidence stays medium-low.
 */
const PROVIDER_CATEGORY_FALLBACK: Array<[RegExp, CardRewardCategoryKey]> = [
  [/FOOD|DINING|RESTAURANT|FAST_FOOD|COFFEE/, "dining"],
  [/GROCERY|SUPERMARKET/, "groceries"],
  [/GAS|FUEL/, "gas"],
  // Plaid TRANSPORTATION mixes gas, transit, rideshare. Prefer transportation
  // for unknowns; known gas brands still resolve via the web catalog / engine.
  [/TRANSPORT/, "transportation"],
  [/TRAVEL|AIRLINE|HOTEL|LODGING|FLIGHT/, "travel"],
  [/PHARMACY|DRUGSTORE|MEDICAL/, "drugstore"],
  [/ENTERTAINMENT|STREAMING|MUSIC|VIDEO|TV_AND_MOVIES/, "subscriptions"],
  [/RENT|UTILIT|TELECOM|INTERNET|PHONE/, "recurring_bills"],
];

function rewardCategoryToKey(category: RewardCategory): CardRewardCategoryKey {
  switch (category) {
    case "dining":
    case "fine_dining":
      return "dining";
    case "groceries":
      return "groceries";
    case "gas":
      return "gas";
    case "travel":
      return "travel";
    case "streaming":
      return "subscriptions";
    case "entertainment":
      return "entertainment";
    case "transportation":
      return "transportation";
    case "drugstore":
      return "drugstore";
    case "recurring_bills":
      return "recurring_bills";
    default:
      return "other";
  }
}

function providerHints(primary: string | undefined): EngineCategory[][] {
  if (!primary) return [];
  const normalized = primary.toUpperCase();
  return PROVIDER_HINTS.filter(([pattern]) => pattern.test(normalized)).map(
    ([, categories]) => categories,
  );
}

function providerCategoryFallback(
  primary: string | undefined,
): CardRewardCategoryKey | undefined {
  if (!primary) return undefined;
  const normalized = primary.toUpperCase();
  for (const [pattern, category] of PROVIDER_CATEGORY_FALLBACK) {
    if (pattern.test(normalized)) return category;
  }
  return undefined;
}

function confidenceBand(confidence: number): CategorizedTransaction["confidenceBand"] {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

function resultFromParts(input: {
  category: CardRewardCategoryKey;
  confidence: number;
  ambiguous?: boolean;
  candidates: CategorizationCandidate[];
  merchantId?: string;
}): CategorizedTransaction {
  const confidence = Math.round(input.confidence * 100) / 100;
  return {
    category: input.category,
    confidence,
    confidenceBand: confidenceBand(confidence),
    ambiguous: input.ambiguous ?? false,
    candidates: input.candidates,
    merchantId: input.merchantId,
  };
}

export function categorizeTransaction(input: CategorizeInput): CategorizedTransaction {
  const brand = resolveHubMerchant(input.merchantName, input.website);
  const brandCategory = brand ? rewardCategoryToKey(brand.category) : undefined;

  const prediction = predictMcc({
    merchantName: input.merchantName,
    domain: input.website,
    channel:
      input.paymentChannel === "online"
        ? "online"
        : input.paymentChannel === "in store"
          ? "in_person"
          : "unknown",
    itemHints: providerHints(input.providerCategoryHint),
  });
  const engineCandidates = prediction.candidates.map((candidate) => ({
    mcc: candidate.mcc,
    label: candidate.label,
    category: CATEGORY_MAP[candidate.category],
    probability: candidate.p,
  }));
  const engineCategory = engineCandidates[0]?.category ?? "other";
  const engineMcc = engineCandidates[0]?.mcc ?? "0000";
  const engineKnown = engineMcc !== "0000";
  const engineConfidence = Math.round(prediction.topConfidence * 100) / 100;

  // 1. Catalog brand with a real reward bucket (dining/gas/groceries/…).
  if (brand && brandCategory && brandCategory !== "other") {
    return resultFromParts({
      category: brandCategory,
      confidence: 0.9,
      merchantId: brand.id,
      candidates: [
        {
          mcc: brand.mcc,
          label: brand.name,
          category: brandCategory,
          probability: 1,
        },
      ],
    });
  }

  // 2. Engine-known merchant (including intentional other/discount/wholesale).
  if (engineKnown) {
    return resultFromParts({
      category: engineCategory,
      confidence: engineConfidence,
      ambiguous: prediction.ambiguous,
      candidates: engineCandidates,
      merchantId: brand?.id,
    });
  }

  // 3. Provider hint when catalog/engine failed open to unknown.
  const hintCategory = providerCategoryFallback(input.providerCategoryHint);
  if (hintCategory) {
    return resultFromParts({
      category: hintCategory,
      confidence: 0.55,
      merchantId: brand?.id,
      candidates: [
        {
          mcc: "0000",
          label: `Provider hint · ${input.providerCategoryHint}`,
          category: hintCategory,
          probability: 1,
        },
      ],
    });
  }

  // 4. Catalog brand that is explicitly `other` (general merchandise).
  if (brand && brandCategory) {
    return resultFromParts({
      category: brandCategory,
      confidence: 0.85,
      merchantId: brand.id,
      candidates: [
        {
          mcc: brand.mcc,
          label: brand.name,
          category: brandCategory,
          probability: 1,
        },
      ],
    });
  }

  return resultFromParts({
    category: engineCategory,
    confidence: engineConfidence,
    ambiguous: prediction.ambiguous,
    candidates: engineCandidates,
  });
}
