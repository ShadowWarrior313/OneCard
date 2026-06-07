import { predictMcc, type Category as EngineCategory } from "@onecard/onecard-engine";
import type { CardRewardCategoryKey } from "@/data/cardRewards";

/**
 * Reward-category derivation — the decision layer Plaid does not build.
 *
 * Plaid (and any provider) returns a generic *budgeting* category. That is not a
 * credit-card reward category, and it is not MCC-accurate. So we IGNORE it as an
 * answer and re-derive the reward category by running every transaction through
 * the MCC engine, which returns a probability distribution + a confidence score.
 * The provider category is passed in only as a weak hint.
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
  convenience: "groceries",
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
  [/FOOD|DINING|RESTAURANT|FAST_FOOD/, ["dining", "fast_food"]],
  [/GROCERY|SUPERMARKET/, ["groceries"]],
  [/GAS|FUEL/, ["gas"]],
  [/TRAVEL|AIRLINE|HOTEL|LODGING/, ["travel", "lodging"]],
  [/PHARMACY|DRUGSTORE|MEDICAL/, ["drugstore"]],
  [/ELECTRONICS/, ["electronics"]],
];

function providerHints(primary: string | undefined): EngineCategory[][] {
  if (!primary) return [];
  const normalized = primary.toUpperCase();
  return PROVIDER_HINTS.filter(([pattern]) => pattern.test(normalized)).map(
    ([, categories]) => categories,
  );
}

function confidenceBand(confidence: number): CategorizedTransaction["confidenceBand"] {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

export function categorizeTransaction(input: CategorizeInput): CategorizedTransaction {
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
  const candidates = prediction.candidates.map((candidate) => ({
    mcc: candidate.mcc,
    label: candidate.label,
    category: CATEGORY_MAP[candidate.category],
    probability: candidate.p,
  }));
  const confidence = Math.round(prediction.topConfidence * 100) / 100;
  return {
    category: candidates[0]?.category ?? "other",
    confidence,
    confidenceBand: confidenceBand(confidence),
    ambiguous: prediction.ambiguous,
    candidates,
  };
}
