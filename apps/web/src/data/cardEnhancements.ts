import type { CardNetwork, CardProduct, RewardRule } from "@onecard/shared-types";
import {
  AMEX_GROCERY_EXCLUSIONS,
  MARRIOTT_PARTNER_MERCHANTS,
  PC_GROCERY_MERCHANTS,
  SCENE_GROCERY_MERCHANTS,
  WESTJET_AIRLINE_MERCHANTS,
} from "./merchantPartners";

/** Payment network per card — required for merchant acceptance routing. */
export const CARD_NETWORKS: Record<string, CardNetwork> = {
  amex_cobalt: "amex",
  amex_gold: "amex",
  amex_platinum: "amex",
  amex_simplycash_preferred: "amex",
  amex_marriott: "amex",
  amex_green: "amex",
  amex_choice: "amex",
  scotia_gold_amex: "amex",
  cibc_costco: "mastercard",
  pc_mastercard: "mastercard",
  pc_world_mc: "mastercard",
  pc_world_elite_mc: "mastercard",
  pc_insiders_we_mc: "mastercard",
  bmo_cashback_we: "mastercard",
  bmo_airmiles: "mastercard",
  bmo_ascend: "mastercard",
  bmo_rewards_mc: "mastercard",
  neo_mastercard: "mastercard",
  neo_world_mc: "mastercard",
  neo_world_elite_mc: "mastercard",
  tangerine_world_elite: "mastercard",
  koho_essential: "mastercard",
  koho_premium: "mastercard",
  manulife_benefits: "mastercard",
};

const DEFAULT_NETWORK: CardNetwork = "visa";

/**
 * Researched merchant-specific and corrected category rules.
 * Sources: issuer benefit guides & program terms (2025–2026).
 */
const REWARD_OVERRIDES: Partial<Record<string, RewardRule[]>> = {
  amex_cobalt: [
    {
      category: "groceries",
      multiplier: 5,
      capMonthly: 2500,
      excludedMerchantIds: [...AMEX_GROCERY_EXCLUSIONS],
    },
    {
      category: "dining",
      multiplier: 5,
      capMonthly: 2500,
    },
    { category: "streaming", multiplier: 3 },
    { category: "other", multiplier: 1 },
  ],
  scotia_scene: [
    { category: "other", multiplier: 1 },
    {
      category: "groceries",
      multiplier: 2,
      merchantIds: [...SCENE_GROCERY_MERCHANTS],
    },
    {
      category: "other",
      multiplier: 2,
      merchantIds: ["cineplex"],
    },
    {
      category: "gas",
      multiplier: 2,
      merchantIds: ["shell"],
    },
  ],
  scotia_gold_amex: [
    { category: "other", multiplier: 1 },
    { category: "dining", multiplier: 5, capMonthly: 200 },
    {
      category: "groceries",
      multiplier: 3,
      merchantIds: [...SCENE_GROCERY_MERCHANTS],
    },
    { category: "gas", multiplier: 3 },
  ],
  pc_mastercard: [
    { category: "other", multiplier: 1 },
    {
      category: "groceries",
      multiplier: 2.5,
      merchantIds: [...PC_GROCERY_MERCHANTS],
    },
    {
      category: "other",
      multiplier: 3.5,
      merchantIds: ["shoppers"],
    },
    {
      category: "gas",
      multiplier: 3,
      merchantIds: ["esso"],
    },
  ],
  pc_world_mc: [
    { category: "other", multiplier: 1 },
    {
      category: "groceries",
      multiplier: 3,
      merchantIds: [...PC_GROCERY_MERCHANTS],
    },
    {
      category: "other",
      multiplier: 4.5,
      merchantIds: ["shoppers"],
    },
    {
      category: "gas",
      multiplier: 3,
      merchantIds: ["esso"],
    },
  ],
  pc_world_elite_mc: [
    { category: "other", multiplier: 1 },
    {
      category: "groceries",
      multiplier: 4.5,
      merchantIds: [...PC_GROCERY_MERCHANTS],
    },
    {
      category: "other",
      multiplier: 6.5,
      merchantIds: ["shoppers"],
    },
    {
      category: "gas",
      multiplier: 3,
      merchantIds: ["esso"],
    },
  ],
  pc_insiders_we_mc: [
    { category: "other", multiplier: 1 },
    {
      category: "groceries",
      multiplier: 5,
      merchantIds: [...PC_GROCERY_MERCHANTS],
    },
    {
      category: "other",
      multiplier: 7,
      merchantIds: ["shoppers"],
    },
    {
      category: "gas",
      multiplier: 3,
      merchantIds: ["esso"],
    },
  ],
  td_aeroplan_infinite: [
    { category: "other", multiplier: 1 },
    { category: "gas", multiplier: 1.5 },
    { category: "groceries", multiplier: 1.5 },
    { category: "travel", multiplier: 1.5 },
  ],
  cibc_aeroplan_infinite: [
    { category: "other", multiplier: 1 },
    { category: "gas", multiplier: 1.5 },
    { category: "dining", multiplier: 1.5 },
    { category: "recurring_bills", multiplier: 1.5 },
    { category: "travel", multiplier: 1.5 },
  ],
  rbc_westjet: [
    { category: "other", multiplier: 1.5 },
    {
      category: "travel",
      multiplier: 3,
      merchantIds: [...WESTJET_AIRLINE_MERCHANTS],
    },
    { category: "travel", multiplier: 1.5 },
    { category: "groceries", multiplier: 2 },
    { category: "gas", multiplier: 2 },
  ],
  amex_marriott: [
    { category: "other", multiplier: 2 },
    {
      category: "travel",
      multiplier: 5,
      merchantIds: [...MARRIOTT_PARTNER_MERCHANTS],
    },
    { category: "travel", multiplier: 2 },
    { category: "dining", multiplier: 3 },
    { category: "gas", multiplier: 2 },
  ],
  cibc_costco: [
    { category: "other", multiplier: 1 },
    { category: "dining", multiplier: 3 },
    {
      category: "gas",
      multiplier: 3,
      merchantIds: ["costco", "costco_wholesale"],
      capMonthly: 5000,
    },
    {
      category: "gas",
      multiplier: 2,
      capMonthly: 5000,
    },
    {
      category: "other",
      multiplier: 2,
      merchantIds: ["costco", "costco_wholesale"],
      capMonthly: 8000,
    },
  ],
};

export function enhanceCardProduct(card: CardProduct): CardProduct {
  const network = CARD_NETWORKS[card.cardId] ?? DEFAULT_NETWORK;
  const rewards = REWARD_OVERRIDES[card.cardId] ?? card.rewards;
  return { ...card, network, rewards };
}

export function enhanceCardCatalog(cards: CardProduct[]): CardProduct[] {
  return cards.map(enhanceCardProduct);
}
