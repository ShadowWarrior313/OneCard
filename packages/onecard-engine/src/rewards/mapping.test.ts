import { describe, it, expect } from "vitest";
import {
  cardCategoryForMcc,
  headlineRateForMcc,
  type Card,
} from "./rewards-rules.js";
import { DINING_4 } from "../data/cards.sample.js";

/**
 * The MCC→category mapping must be PER PROGRAM. Two cards seeing the same
 * fast-food MCC (5814) can legitimately bucket it differently: one counts it
 * as dining, the other doesn't. Modeling this globally is a real source of
 * wrong recommendations.
 */

// A strict dining program: NO override for 5814, so fast food stays fast_food
// and (absent a fast_food bonus) earns only the base rate.
const DINING_STRICT: Card = {
  cardId: "dining_strict",
  displayName: "Dining Strict 4%",
  issuer: "Sample Bank",
  network: "visa",
  program: {
    programId: "dining_strict",
    baseRate: 0.01,
    rates: { dining: { rate: 0.04 } },
  },
};

describe("per-program MCC → category mapping", () => {
  it("counts fast food (5814) as dining only for the program that says so", () => {
    expect(cardCategoryForMcc(DINING_4, "5814")).toBe("dining");
    expect(cardCategoryForMcc(DINING_STRICT, "5814")).toBe("fast_food");
  });

  it("both still agree on sit-down restaurants (5812 → dining)", () => {
    expect(cardCategoryForMcc(DINING_4, "5812")).toBe("dining");
    expect(cardCategoryForMcc(DINING_STRICT, "5812")).toBe("dining");
  });

  it("the mapping difference changes the earned rate on fast food", () => {
    // 5814: the override card earns its dining bonus; the strict card earns base.
    expect(headlineRateForMcc(DINING_4, "5814")).toBe(0.04);
    expect(headlineRateForMcc(DINING_STRICT, "5814")).toBe(0.01);
    // 5812: both earn the dining bonus.
    expect(headlineRateForMcc(DINING_4, "5812")).toBe(0.04);
    expect(headlineRateForMcc(DINING_STRICT, "5812")).toBe(0.04);
  });
});
