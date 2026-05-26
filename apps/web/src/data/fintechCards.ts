import type { CardProduct } from "@onecard/shared-types";

/**
 * Fintech & alternative issuers (May 2026 sources):
 * - https://www.pcfinancial.ca/en/credit-cards/
 * - https://www.simplii.com/en/credit-cards.html
 * - https://www.wealthsimple.com/en-ca/credit-card
 * - https://www.neofinancial.com/credit
 * - https://www.tangerine.ca/en/personal/spend/credit-cards
 * - https://www.koho.ca/
 * - https://www.manulifebank.ca/personal-banking/credit-cards.html
 */

export const FINTECH_CARDS: CardProduct[] = [
  {
    cardId: "simplii_cashback_visa",
    issuer: "Simplii Financial",
    displayName: "Simplii Financial Cash Back Visa Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "dining", multiplier: 4, capMonthly: 200 },
      { category: "gas", multiplier: 2, capMonthly: 200 },
      { category: "groceries", multiplier: 2, capMonthly: 200 },
      { category: "other", multiplier: 0.5 },
    ],
  },
  {
    cardId: "ws_credit_infinite",
    issuer: "Wealthsimple",
    displayName: "Wealthsimple Visa Infinite+ Credit Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 240,
    rewards: [{ category: "other", multiplier: 2 }],
  },
  {
    cardId: "ws_credit_privilege",
    issuer: "Wealthsimple",
    displayName: "Wealthsimple Visa Infinite Privilege Credit Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 240,
    rewards: [{ category: "other", multiplier: 2 }],
  },
  {
    cardId: "pc_mastercard",
    issuer: "PC Financial",
    displayName: "PC Mastercard",
    currency: "PC Optimum points",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 2.5 },
      { category: "gas", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "pc_world_mc",
    issuer: "PC Financial",
    displayName: "PC World Mastercard",
    currency: "PC Optimum points",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 3 },
      { category: "gas", multiplier: 3 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    cardId: "pc_world_elite_mc",
    issuer: "PC Financial",
    displayName: "PC World Elite Mastercard",
    currency: "PC Optimum points",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 4.5 },
      { category: "gas", multiplier: 3 },
      { category: "other", multiplier: 3 },
    ],
  },
  {
    cardId: "pc_insiders_we_mc",
    issuer: "PC Financial",
    displayName: "PC Insiders World Elite Mastercard",
    currency: "PC Optimum points",
    pointValueCents: 1,
    annualFee: 119,
    rewards: [
      { category: "groceries", multiplier: 5 },
      { category: "gas", multiplier: 3 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    cardId: "neo_mastercard",
    issuer: "Neo Financial",
    displayName: "Neo Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 1 }],
  },
  {
    cardId: "neo_world_mc",
    issuer: "Neo Financial",
    displayName: "Neo World Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 3 },
      { category: "recurring_bills", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "neo_world_elite_mc",
    issuer: "Neo Financial",
    displayName: "Neo World Elite Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 125,
    rewards: [
      { category: "groceries", multiplier: 5, capMonthly: 1000 },
      { category: "recurring_bills", multiplier: 4, capMonthly: 500 },
      { category: "gas", multiplier: 3, capMonthly: 1000 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "tangerine_money_back",
    issuer: "Tangerine",
    displayName: "Tangerine Money-Back Credit Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "recurring_bills", multiplier: 2 },
      { category: "other", multiplier: 0.5 },
    ],
  },
  {
    cardId: "tangerine_world_elite",
    issuer: "Tangerine",
    displayName: "Tangerine World Elite Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "koho_essential",
    issuer: "KOHO",
    displayName: "KOHO Essential Prepaid Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 0.5 }],
  },
  {
    cardId: "koho_premium",
    issuer: "KOHO",
    displayName: "KOHO Premium Prepaid Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 84,
    rewards: [
      { category: "groceries", multiplier: 2 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 0.5 },
    ],
  },
  {
    cardId: "manulife_benefits",
    issuer: "Manulife",
    displayName: "Manulife Visa Benefits Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 1 }],
  },
];
