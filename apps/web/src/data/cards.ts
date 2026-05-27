import type { CardProduct } from "@onecard/shared-types";
import { FINTECH_CARDS } from "./fintechCards";
import { enhanceCardCatalog } from "./cardEnhancements";
import type { CardMeta } from "./cardRewards";

/**
 * Curated Canadian credit cards (Amex + Big Six + National Bank + fintech).
 * Reward rates live exclusively in src/data/cardRewards.ts.
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

export const BANK_CARDS: CardMeta[] = [
  { cardId: "amex_cobalt", issuer: "American Express", displayName: "American Express Cobalt Card" },
  { cardId: "amex_gold", issuer: "American Express", displayName: "American Express Gold Rewards Card" },
  { cardId: "amex_platinum", issuer: "American Express", displayName: "American Express Platinum Card" },
  { cardId: "amex_simplycash_preferred", issuer: "American Express", displayName: "SimplyCash Preferred Card" },
  { cardId: "amex_marriott", issuer: "American Express", displayName: "Marriott Bonvoy American Express Card" },
  { cardId: "amex_green", issuer: "American Express", displayName: "American Express Green Card" },
  { cardId: "amex_choice", issuer: "American Express", displayName: "American Express Choice Card" },
  { cardId: "cibc_dividend_platinum", issuer: "CIBC", displayName: "CIBC Dividend Platinum Visa Card" },
  { cardId: "cibc_dividend", issuer: "CIBC", displayName: "CIBC Dividend Visa Card" },
  { cardId: "cibc_dividend_infinite", issuer: "CIBC", displayName: "CIBC Dividend Visa Infinite Card" },
  { cardId: "cibc_aeroplan_infinite", issuer: "CIBC", displayName: "CIBC Aeroplan Visa Infinite Card" },
  { cardId: "cibc_aventura_infinite", issuer: "CIBC", displayName: "CIBC Aventura Visa Infinite Card" },
  { cardId: "cibc_aventura_gold", issuer: "CIBC", displayName: "CIBC Aventura Gold Visa Card" },
  { cardId: "cibc_select", issuer: "CIBC", displayName: "CIBC Select Visa Card" },
  { cardId: "cibc_adapta", issuer: "CIBC", displayName: "CIBC Adapta Mastercard" },
  { cardId: "cibc_costco", issuer: "CIBC", displayName: "CIBC Costco Mastercard" },
  { cardId: "rbc_avion_infinite", issuer: "RBC", displayName: "RBC Avion Visa Infinite Card" },
  { cardId: "rbc_avion_infinite_privilege", issuer: "RBC", displayName: "RBC Avion Visa Infinite Privilege Card" },
  { cardId: "rbc_ion", issuer: "RBC", displayName: "RBC Ion Visa Card" },
  { cardId: "rbc_ion_plus", issuer: "RBC", displayName: "RBC Ion+ Visa Card" },
  { cardId: "rbc_westjet", issuer: "RBC", displayName: "WestJet RBC World Elite Mastercard" },
  { cardId: "rbc_cashback_preferred", issuer: "RBC", displayName: "RBC Cash Back Preferred World Elite Mastercard" },
  { cardId: "rbc_low_rate", issuer: "RBC", displayName: "RBC Visa Classic Low Rate Option" },
  { cardId: "td_aeroplan_infinite", issuer: "TD", displayName: "TD Aeroplan Visa Infinite Card" },
  { cardId: "td_aeroplan_platinum", issuer: "TD", displayName: "TD Aeroplan Visa Platinum Card" },
  { cardId: "td_cashback_infinite", issuer: "TD", displayName: "TD Cash Back Visa Infinite Card" },
  { cardId: "td_cashback", issuer: "TD", displayName: "TD Cash Back Visa Card" },
  { cardId: "td_first_class", issuer: "TD", displayName: "TD First Class Travel Visa Infinite Card" },
  { cardId: "td_rewards_visa", issuer: "TD", displayName: "TD Rewards Visa Card" },
  { cardId: "td_emerald_flex", issuer: "TD", displayName: "TD Emerald Flex Rate Visa Card" },
  { cardId: "scotia_momentum", issuer: "Scotiabank", displayName: "Scotia Momentum Visa Infinite Card" },
  { cardId: "scotia_momentum_no_fee", issuer: "Scotiabank", displayName: "Scotia Momentum No-Fee Visa Card" },
  { cardId: "scotia_scene", issuer: "Scotiabank", displayName: "Scotiabank Scene+ Visa Card" },
  { cardId: "scotia_passport", issuer: "Scotiabank", displayName: "Scotiabank Passport Visa Infinite Card" },
  { cardId: "scotia_gold_amex", issuer: "Scotiabank", displayName: "Scotiabank Gold American Express Card" },
  { cardId: "bmo_eclipse", issuer: "BMO", displayName: "BMO eclipse Visa Infinite Privilege Card" },
  { cardId: "bmo_eclipse_rise", issuer: "BMO", displayName: "BMO eclipse rise Visa Card" },
  { cardId: "bmo_cashback_we", issuer: "BMO", displayName: "BMO CashBack World Elite Mastercard" },
  { cardId: "bmo_cashback", issuer: "BMO", displayName: "BMO CashBack Mastercard" },
  { cardId: "bmo_airmiles", issuer: "BMO", displayName: "BMO AIR MILES World Elite Mastercard" },
  { cardId: "bmo_ascend", issuer: "BMO", displayName: "BMO Ascend World Elite Mastercard" },
  { cardId: "bmo_rewards_mc", issuer: "BMO", displayName: "BMO Rewards Mastercard" },
  { cardId: "nbc_platinum", issuer: "National Bank", displayName: "National Bank Platinum Mastercard" },
  { cardId: "nbc_world_elite", issuer: "National Bank", displayName: "National Bank World Elite Mastercard" },
  { cardId: "nbc_my_credit", issuer: "National Bank", displayName: "National Bank mycredit Mastercard" },
  { cardId: "nbc_allure", issuer: "National Bank", displayName: "National Bank Allure Mastercard" },
];

export const CARD_CATALOG: CardProduct[] = enhanceCardCatalog([
  ...BANK_CARDS,
  ...FINTECH_CARDS,
]);

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
