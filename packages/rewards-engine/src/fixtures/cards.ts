import type { CardProduct } from "@onecard/shared-types";

/** Minimal fixtures for unit tests — full seed DB comes later. */
export const AMEX_COBALT: CardProduct = {
  cardId: "amex_cobalt",
  issuer: "American Express",
  displayName: "AMEX Cobalt",
  currency: "MR points",
  pointValueCents: 2,
  network: "amex",
  rewards: [
    { category: "groceries", multiplier: 5, capMonthly: 500 },
    { category: "dining", multiplier: 5, capMonthly: 500 },
    { category: "streaming", multiplier: 3 },
    { category: "other", multiplier: 1 },
  ],
};

export const CIBC_DIVIDEND: CardProduct = {
  cardId: "cibc_dividend",
  issuer: "CIBC",
  displayName: "CIBC Dividend Visa",
  currency: "cashback %",
  pointValueCents: 1,
  rewards: [
    { category: "groceries", multiplier: 2 },
    { category: "gas", multiplier: 2 },
    { category: "other", multiplier: 1 },
  ],
};
