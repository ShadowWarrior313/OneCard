import type { CardProduct } from "@onecard/shared-types";
import { FINTECH_CARDS } from "./fintechCards";

/**
 * Curated Canadian credit cards (Amex + Big Six + National Bank + fintech).
 * Reward rates are simplified for routing math — verify on issuer sites before production.
 *
 * Primary sources (May 2026):
 * - https://www.cibc.com/en/personal-banking/credit-cards.html
 * - https://www.cibc.com/en/special-offers/dividend-platinum-visa-cash-back-offer-media.html
 * - https://www.rbcroyalbank.com/credit-cards/
 * - https://www.td.com/ca/en/personal-banking/products/credit-cards
 * - https://www.scotiabank.com/ca/en/personal/credit-cards.html
 * - https://www.bmo.com/main/personal/credit-cards/
 * - https://www.nbc.ca/personal/accounts/credit-cards.html
 * - https://www.americanexpress.com/ca/en/credit-cards/
 * - https://www.pcfinancial.ca/en/credit-cards/
 * - https://www.simplii.com/en/credit-cards.html
 * - https://www.wealthsimple.com/en-ca/credit-card
 * - https://www.neofinancial.com/credit
 * - https://www.tangerine.ca/en/personal/spend/credit-cards
 * - https://www.koho.ca/
 * - https://www.manulifebank.ca/personal-banking/credit-cards.html
 */

export type CardIssuerGroup =
  | "American Express"
  | "CIBC"
  | "RBC"
  | "TD"
  | "Scotiabank"
  | "BMO"
  | "National Bank"
  | "Simplii Financial"
  | "Wealthsimple"
  | "PC Financial"
  | "Neo Financial"
  | "Tangerine"
  | "KOHO"
  | "Manulife";

const BANK_CARDS: CardProduct[] = [
  // —— American Express ——
  {
    cardId: "amex_cobalt",
    issuer: "American Express",
    displayName: "American Express Cobalt Card",
    currency: "MR points",
    pointValueCents: 2,
    annualFee: 155.88,
    rewards: [
      { category: "groceries", multiplier: 5, capMonthly: 500 },
      { category: "dining", multiplier: 5, capMonthly: 500 },
      { category: "streaming", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "amex_gold",
    issuer: "American Express",
    displayName: "American Express Gold Rewards Card",
    currency: "MR points",
    pointValueCents: 2,
    annualFee: 250,
    rewards: [
      { category: "travel", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "amex_platinum",
    issuer: "American Express",
    displayName: "American Express Platinum Card",
    currency: "MR points",
    pointValueCents: 2,
    annualFee: 699,
    rewards: [
      { category: "travel", multiplier: 2 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "amex_simplycash_preferred",
    issuer: "American Express",
    displayName: "SimplyCash Preferred Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 99,
    rewards: [
      { category: "groceries", multiplier: 2, capMonthly: 300 },
      { category: "gas", multiplier: 2, capMonthly: 300 },
      { category: "other", multiplier: 1.5 },
    ],
  },
  {
    cardId: "amex_marriott",
    issuer: "American Express",
    displayName: "Marriott Bonvoy American Express Card",
    currency: "Bonvoy points",
    pointValueCents: 0.9,
    annualFee: 120,
    rewards: [
      { category: "travel", multiplier: 5 },
      { category: "dining", multiplier: 3 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    cardId: "amex_green",
    issuer: "American Express",
    displayName: "American Express Green Card",
    currency: "MR points",
    pointValueCents: 2,
    annualFee: 0,
    rewards: [
      { category: "travel", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "amex_choice",
    issuer: "American Express",
    displayName: "American Express Choice Card",
    currency: "MR points",
    pointValueCents: 2,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 1 }],
  },

  // —— CIBC ——
  {
    cardId: "cibc_dividend_platinum",
    issuer: "CIBC",
    displayName: "CIBC Dividend Platinum Visa Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 99,
    rewards: [
      { category: "gas", multiplier: 3 },
      { category: "groceries", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "travel", multiplier: 2 },
      { category: "recurring_bills", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "cibc_dividend",
    issuer: "CIBC",
    displayName: "CIBC Dividend Visa Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "cibc_dividend_infinite",
    issuer: "CIBC",
    displayName: "CIBC Dividend Visa Infinite Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 120,
    rewards: [
      { category: "gas", multiplier: 4, capMonthly: 80 },
      { category: "groceries", multiplier: 2, capMonthly: 80 },
      { category: "recurring_bills", multiplier: 2, capMonthly: 80 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "cibc_aeroplan_infinite",
    issuer: "CIBC",
    displayName: "CIBC Aeroplan Visa Infinite Card",
    currency: "Aeroplan points",
    pointValueCents: 2,
    annualFee: 139,
    rewards: [
      { category: "travel", multiplier: 1.5 },
      { category: "gas", multiplier: 1.5 },
      { category: "dining", multiplier: 1.5 },
      { category: "recurring_bills", multiplier: 1.5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "cibc_aventura_infinite",
    issuer: "CIBC",
    displayName: "CIBC Aventura Visa Infinite Card",
    currency: "Aventura points",
    pointValueCents: 1.2,
    annualFee: 139,
    rewards: [
      { category: "gas", multiplier: 2 },
      { category: "dining", multiplier: 2 },
      { category: "travel", multiplier: 2 },
      { category: "other", multiplier: 1.5 },
    ],
  },
  {
    cardId: "cibc_aventura_gold",
    issuer: "CIBC",
    displayName: "CIBC Aventura Gold Visa Card",
    currency: "Aventura points",
    pointValueCents: 1.2,
    annualFee: 89,
    rewards: [
      { category: "travel", multiplier: 1.5 },
      { category: "gas", multiplier: 1.5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "cibc_select",
    issuer: "CIBC",
    displayName: "CIBC Select Visa Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 29,
    rewards: [{ category: "other", multiplier: 1 }],
  },
  {
    cardId: "cibc_adapta",
    issuer: "CIBC",
    displayName: "CIBC Adapta Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 1 }],
  },
  {
    cardId: "cibc_costco",
    issuer: "CIBC",
    displayName: "CIBC Costco Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "gas", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },

  // —— RBC ——
  {
    cardId: "rbc_avion_infinite",
    issuer: "RBC",
    displayName: "RBC Avion Visa Infinite Card",
    currency: "Avion points",
    pointValueCents: 1.4,
    annualFee: 120,
    rewards: [
      { category: "travel", multiplier: 1.25 },
      { category: "dining", multiplier: 1.25 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "rbc_avion_infinite_privilege",
    issuer: "RBC",
    displayName: "RBC Avion Visa Infinite Privilege Card",
    currency: "Avion points",
    pointValueCents: 1.4,
    annualFee: 399,
    rewards: [
      { category: "travel", multiplier: 1.25 },
      { category: "dining", multiplier: 1.25 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "rbc_ion",
    issuer: "RBC",
    displayName: "RBC Ion Visa Card",
    currency: "Avion points",
    pointValueCents: 1.4,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 3, capMonthly: 500 },
      { category: "gas", multiplier: 3, capMonthly: 500 },
      { category: "streaming", multiplier: 3, capMonthly: 500 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "rbc_ion_plus",
    issuer: "RBC",
    displayName: "RBC Ion+ Visa Card",
    currency: "Avion points",
    pointValueCents: 1.4,
    annualFee: 48,
    rewards: [
      { category: "groceries", multiplier: 3, capMonthly: 500 },
      { category: "gas", multiplier: 3, capMonthly: 500 },
      { category: "streaming", multiplier: 3, capMonthly: 500 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "rbc_westjet",
    issuer: "RBC",
    displayName: "WestJet RBC World Elite Mastercard",
    currency: "WestJet dollars",
    pointValueCents: 1,
    annualFee: 119,
    rewards: [
      { category: "travel", multiplier: 3 },
      { category: "groceries", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1.5 },
    ],
  },
  {
    cardId: "rbc_cashback_preferred",
    issuer: "RBC",
    displayName: "RBC Cash Back Preferred World Elite Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 99,
    rewards: [
      { category: "groceries", multiplier: 2 },
      { category: "gas", multiplier: 1.5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "rbc_low_rate",
    issuer: "RBC",
    displayName: "RBC Visa Classic Low Rate Option",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 20,
    rewards: [{ category: "other", multiplier: 0.5 }],
  },

  // —— TD ——
  {
    cardId: "td_aeroplan_infinite",
    issuer: "TD",
    displayName: "TD Aeroplan Visa Infinite Card",
    currency: "Aeroplan points",
    pointValueCents: 2,
    annualFee: 139,
    rewards: [
      { category: "travel", multiplier: 1.5 },
      { category: "gas", multiplier: 1.5 },
      { category: "dining", multiplier: 1.5 },
      { category: "recurring_bills", multiplier: 1.5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "td_aeroplan_platinum",
    issuer: "TD",
    displayName: "TD Aeroplan Visa Platinum Card",
    currency: "Aeroplan points",
    pointValueCents: 2,
    annualFee: 89,
    rewards: [
      { category: "travel", multiplier: 1.5 },
      { category: "gas", multiplier: 1.5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "td_cashback_infinite",
    issuer: "TD",
    displayName: "TD Cash Back Visa Infinite Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 139,
    rewards: [
      { category: "gas", multiplier: 3, capMonthly: 150 },
      { category: "groceries", multiplier: 3, capMonthly: 150 },
      { category: "recurring_bills", multiplier: 3, capMonthly: 150 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "td_cashback",
    issuer: "TD",
    displayName: "TD Cash Back Visa Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 2, capMonthly: 100 },
      { category: "gas", multiplier: 2, capMonthly: 100 },
      { category: "other", multiplier: 0.5 },
    ],
  },
  {
    cardId: "td_first_class",
    issuer: "TD",
    displayName: "TD First Class Travel Visa Infinite Card",
    currency: "TD Rewards",
    pointValueCents: 0.5,
    annualFee: 139,
    rewards: [
      { category: "travel", multiplier: 8 },
      { category: "dining", multiplier: 4 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    cardId: "td_rewards_visa",
    issuer: "TD",
    displayName: "TD Rewards Visa Card",
    currency: "TD Rewards",
    pointValueCents: 0.5,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 1 }],
  },
  {
    cardId: "td_emerald_flex",
    issuer: "TD",
    displayName: "TD Emerald Flex Rate Visa Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 0.5 }],
  },

  // —— Scotiabank ——
  {
    cardId: "scotia_momentum",
    issuer: "Scotiabank",
    displayName: "Scotia Momentum Visa Infinite Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 120,
    rewards: [
      { category: "groceries", multiplier: 4, capMonthly: 250 },
      { category: "recurring_bills", multiplier: 4, capMonthly: 250 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "scotia_momentum_no_fee",
    issuer: "Scotiabank",
    displayName: "Scotia Momentum No-Fee Visa Card",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 2, capMonthly: 100 },
      { category: "recurring_bills", multiplier: 2, capMonthly: 100 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "scotia_scene",
    issuer: "Scotiabank",
    displayName: "Scotiabank Scene+ Visa Card",
    currency: "Scene+ points",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 5, capMonthly: 250 },
      { category: "dining", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "scotia_passport",
    issuer: "Scotiabank",
    displayName: "Scotiabank Passport Visa Infinite Card",
    currency: "Scene+ points",
    pointValueCents: 1,
    annualFee: 150,
    rewards: [
      { category: "travel", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "scotia_gold_amex",
    issuer: "Scotiabank",
    displayName: "Scotiabank Gold American Express Card",
    currency: "Scene+ points",
    pointValueCents: 1,
    annualFee: 120,
    rewards: [
      { category: "dining", multiplier: 5, capMonthly: 200 },
      { category: "groceries", multiplier: 3 },
      { category: "gas", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },

  // —— BMO ——
  {
    cardId: "bmo_eclipse",
    issuer: "BMO",
    displayName: "BMO eclipse Visa Infinite Privilege Card",
    currency: "BMO Rewards",
    pointValueCents: 0.67,
    annualFee: 499,
    rewards: [
      { category: "travel", multiplier: 5 },
      { category: "dining", multiplier: 3 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "bmo_eclipse_rise",
    issuer: "BMO",
    displayName: "BMO eclipse rise Visa Card",
    currency: "BMO Rewards",
    pointValueCents: 0.67,
    annualFee: 0,
    rewards: [
      { category: "dining", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "bmo_cashback_we",
    issuer: "BMO",
    displayName: "BMO CashBack World Elite Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 120,
    rewards: [
      { category: "groceries", multiplier: 5, capMonthly: 500 },
      { category: "gas", multiplier: 4, capMonthly: 250 },
      { category: "recurring_bills", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "bmo_cashback",
    issuer: "BMO",
    displayName: "BMO CashBack Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [
      { category: "groceries", multiplier: 3, capMonthly: 100 },
      { category: "recurring_bills", multiplier: 1 },
      { category: "other", multiplier: 0.5 },
    ],
  },
  {
    cardId: "bmo_airmiles",
    issuer: "BMO",
    displayName: "BMO AIR MILES World Elite Mastercard",
    currency: "AIR MILES",
    pointValueCents: 1.2,
    annualFee: 120,
    rewards: [
      { category: "gas", multiplier: 3 },
      { category: "groceries", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "bmo_ascend",
    issuer: "BMO",
    displayName: "BMO Ascend World Elite Mastercard",
    currency: "BMO Rewards",
    pointValueCents: 0.67,
    annualFee: 150,
    rewards: [
      { category: "travel", multiplier: 5 },
      { category: "dining", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "bmo_rewards_mc",
    issuer: "BMO",
    displayName: "BMO Rewards Mastercard",
    currency: "BMO Rewards",
    pointValueCents: 0.67,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 1 }],
  },

  // —— National Bank ——
  {
    cardId: "nbc_platinum",
    issuer: "National Bank",
    displayName: "National Bank Platinum Mastercard",
    currency: "À la carte points",
    pointValueCents: 1,
    annualFee: 89,
    rewards: [
      { category: "dining", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "travel", multiplier: 2 },
      { category: "other", multiplier: 1.5 },
    ],
  },
  {
    cardId: "nbc_world_elite",
    issuer: "National Bank",
    displayName: "National Bank World Elite Mastercard",
    currency: "À la carte points",
    pointValueCents: 1,
    annualFee: 150,
    rewards: [
      { category: "travel", multiplier: 2 },
      { category: "dining", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1.5 },
    ],
  },
  {
    cardId: "nbc_my_credit",
    issuer: "National Bank",
    displayName: "National Bank mycredit Mastercard",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 0,
    rewards: [{ category: "other", multiplier: 1 }],
  },
  {
    cardId: "nbc_allure",
    issuer: "National Bank",
    displayName: "National Bank Allure Mastercard",
    currency: "À la carte points",
    pointValueCents: 1,
    annualFee: 60,
    rewards: [
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
];

export const CARD_CATALOG: CardProduct[] = [...BANK_CARDS, ...FINTECH_CARDS];

export const ISSUER_GROUPS: CardIssuerGroup[] = [
  "American Express",
  "CIBC",
  "RBC",
  "TD",
  "Scotiabank",
  "BMO",
  "National Bank",
  "Simplii Financial",
  "Wealthsimple",
  "PC Financial",
  "Neo Financial",
  "Tangerine",
  "KOHO",
  "Manulife",
];

export const CARD_COUNT = CARD_CATALOG.length;

export function cardsByIssuer(issuer: CardIssuerGroup): CardProduct[] {
  return CARD_CATALOG.filter((c) => c.issuer === issuer);
}

export function getCardById(id: string): CardProduct | undefined {
  return CARD_CATALOG.find((c) => c.cardId === id);
}

/** Issuer marketing pages for “learn more” links in UI */
export const ISSUER_CARD_PAGES: Record<CardIssuerGroup, string> = {
  "American Express": "https://www.americanexpress.com/ca/en/credit-cards/",
  CIBC: "https://www.cibc.com/en/personal-banking/credit-cards.html",
  RBC: "https://www.rbcroyalbank.com/credit-cards/",
  TD: "https://www.td.com/ca/en/personal-banking/products/credit-cards",
  Scotiabank: "https://www.scotiabank.com/ca/en/personal/credit-cards.html",
  BMO: "https://www.bmo.com/main/personal/credit-cards/",
  "National Bank": "https://www.nbc.ca/personal/accounts/credit-cards.html",
  "Simplii Financial": "https://www.simplii.com/en/credit-cards.html",
  Wealthsimple: "https://www.wealthsimple.com/en-ca/credit-card",
  "PC Financial": "https://www.pcfinancial.ca/en/credit-cards/",
  "Neo Financial": "https://www.neofinancial.com/credit",
  Tangerine: "https://www.tangerine.ca/en/personal/spend/credit-cards",
  KOHO: "https://www.koho.ca/",
  Manulife: "https://www.manulifebank.ca/personal-banking/credit-cards.html",
};
