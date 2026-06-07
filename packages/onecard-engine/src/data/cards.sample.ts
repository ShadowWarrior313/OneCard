/**
 * Sample wallet for testing and demos.
 *
 * Rates are EFFECTIVE CASH-VALUE FRACTIONS (0.05 = 5% back), per rewards-rules.
 * Numbers are illustrative but realistic. Note how the cards deliberately
 * disagree on MCC→category bucketing (the dining card counts fast food as
 * dining via an override; others don't) — that per-program nuance is the whole
 * point of modeling category mapping per program.
 *
 * No card numbers, expiries, or CVV live here — only identity + reward rules.
 * The engine recommends; it never charges.
 */

import type { Card } from "../rewards/rewards-rules.js";

/** Strong flat card. The fail-safe / catch-all pick under uncertainty. */
export const EVERYWHERE_2: Card = {
  cardId: "everywhere_2",
  displayName: "Everywhere 2% Card",
  issuer: "Sample Bank",
  network: "visa",
  isCatchAll: true,
  program: {
    programId: "everywhere_2",
    baseRate: 0.02,
    rates: {},
  },
};

/** 5% groceries (5411 only). Does NOT bonus big-box discount MCCs. */
export const GROCERY_HERO: Card = {
  cardId: "grocery_hero",
  displayName: "Grocery Hero 5%",
  issuer: "Sample Bank",
  network: "mastercard",
  program: {
    programId: "grocery_hero",
    baseRate: 0.01,
    rates: {
      groceries: { rate: 0.05 },
    },
  },
};

/**
 * 4% dining — and it COUNTS fast food as dining via a per-program override on
 * 5814. A different program that omitted this override would earn only base on
 * fast food (see mapping.test.ts).
 */
export const DINING_4: Card = {
  cardId: "dining_4",
  displayName: "Dining Plus 4%",
  issuer: "Sample Bank",
  network: "amex",
  program: {
    programId: "dining_4",
    baseRate: 0.01,
    mccCategoryOverrides: { "5814": "dining" },
    rates: {
      dining: { rate: 0.04 },
    },
  },
};

/** 4% travel & lodging. Wins the hotel-sundry case via the lodging rate. */
export const TRAVEL_4: Card = {
  cardId: "travel_4",
  displayName: "Travel Elite 4%",
  issuer: "Sample Bank",
  network: "visa",
  program: {
    programId: "travel_4",
    baseRate: 0.01,
    rates: {
      travel: { rate: 0.04 },
      lodging: { rate: 0.04 },
    },
  },
};

/** 4% gas. Wins at the pump (and at a warehouse-club fuel station). */
export const GAS_4: Card = {
  cardId: "gas_4",
  displayName: "Fuel Saver 4%",
  issuer: "Sample Bank",
  network: "visa",
  program: {
    programId: "gas_4",
    baseRate: 0.01,
    rates: {
      gas: { rate: 0.04 },
    },
  },
};

/** Default test wallet. */
export const SAMPLE_WALLET: Card[] = [
  EVERYWHERE_2,
  GROCERY_HERO,
  DINING_4,
  TRAVEL_4,
  GAS_4,
];
