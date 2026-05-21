import type { CardProduct } from "@onecard/shared-types";

/**
 * Curated Amex + Big Six (CA) cards for the demo simulator.
 * Rates are simplified for routing math; verify against issuer T&Cs before production.
 *
 * Sources (May 2026):
 * - https://www.americanexpress.com/ca/en/benefits/
 * - Issuer product pages: CIBC, RBC, TD, Scotiabank, BMO, NBC
 */

export type CardIssuerGroup =
  | "American Express"
  | "CIBC"
  | "RBC"
  | "TD"
  | "Scotiabank"
  | "BMO"
  | "National Bank";

export const CARD_CATALOG: CardProduct[] = [
  // —— American Express ——
  {
    cardId: "amex_cobalt",
    issuer: "American Express",
    displayName: "American Express Cobalt",
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
    displayName: "American Express Gold Rewards",
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
    displayName: "SimplyCash Preferred",
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
    displayName: "Marriott Bonvoy American Express",
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

  // —— CIBC ——
  {
    cardId: "cibc_aeroplan_infinite",
    issuer: "CIBC",
    displayName: "CIBC Aeroplan Visa Infinite",
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
    cardId: "cibc_dividend_infinite",
    issuer: "CIBC",
    displayName: "CIBC Dividend Visa Infinite",
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
    cardId: "cibc_aventura_infinite",
    issuer: "CIBC",
    displayName: "CIBC Aventura Visa Infinite",
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

  // —— RBC ——
  {
    cardId: "rbc_avion_infinite",
    issuer: "RBC",
    displayName: "RBC Avion Visa Infinite",
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
    cardId: "rbc_westjet",
    issuer: "RBC",
    displayName: "RBC WestJet RBC World Elite Mastercard",
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
    cardId: "rbc_ion",
    issuer: "RBC",
    displayName: "RBC Ion Visa",
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

  // —— TD ——
  {
    cardId: "td_aeroplan_infinite",
    issuer: "TD",
    displayName: "TD Aeroplan Visa Infinite",
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
    cardId: "td_cashback_infinite",
    issuer: "TD",
    displayName: "TD Cash Back Visa Infinite",
    currency: "cashback %",
    pointValueCents: 1,
    annualFee: 129,
    rewards: [
      { category: "gas", multiplier: 3, capMonthly: 150 },
      { category: "groceries", multiplier: 3, capMonthly: 150 },
      { category: "recurring_bills", multiplier: 3, capMonthly: 150 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    cardId: "td_first_class",
    issuer: "TD",
    displayName: "TD First Class Travel Visa Infinite",
    currency: "TD Rewards",
    pointValueCents: 0.5,
    annualFee: 139,
    rewards: [
      { category: "travel", multiplier: 8 },
      { category: "dining", multiplier: 4 },
      { category: "other", multiplier: 2 },
    ],
  },

  // —— Scotiabank ——
  {
    cardId: "scotia_momentum",
    issuer: "Scotiabank",
    displayName: "Scotia Momentum Visa Infinite",
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
    cardId: "scotia_scene",
    issuer: "Scotiabank",
    displayName: "Scotiabank Scene+ Visa",
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
    displayName: "Scotiabank Passport Visa Infinite",
    currency: "Scene+ points",
    pointValueCents: 1,
    annualFee: 150,
    rewards: [
      { category: "travel", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },

  // —— BMO ——
  {
    cardId: "bmo_eclipse",
    issuer: "BMO",
    displayName: "BMO eclipse Visa Infinite Privilege",
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
    cardId: "bmo_airmiles",
    issuer: "BMO",
    displayName: "BMO AIR MILES World Elite",
    currency: "AIR MILES",
    pointValueCents: 1.2,
    annualFee: 120,
    rewards: [
      { category: "gas", multiplier: 3 },
      { category: "groceries", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
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
];

export const ISSUER_GROUPS: CardIssuerGroup[] = [
  "American Express",
  "CIBC",
  "RBC",
  "TD",
  "Scotiabank",
  "BMO",
  "National Bank",
];

export function cardsByIssuer(issuer: CardIssuerGroup): CardProduct[] {
  return CARD_CATALOG.filter((c) => c.issuer === issuer);
}

export function getCardById(id: string): CardProduct | undefined {
  return CARD_CATALOG.find((c) => c.cardId === id);
}
