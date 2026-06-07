import { describe, it, expect } from "vitest";
import { recommend } from "../../recommend.js";
import { SAMPLE_WALLET } from "../cards.sample.js";
import { DEFAULT_CONFIG } from "../../config.js";
import type { Category } from "../../mcc/mcc-catalog.js";
import {
  ALL_FIXTURES,
  WALMART_RAZOR,
  WALMART_GROCERIES,
  COSTCO_WAREHOUSE,
  COSTCO_GAS,
  HOTEL_CANDY,
  GAS_QSR_COMPOSITE,
  FOOD_TRUCK,
  CLEAN_GROCERY,
  UNKNOWN_ONLINE,
  type Fixture,
} from "./index.js";

const run = (f: Fixture) =>
  recommend({ context: f.context, wallet: SAMPLE_WALLET, amount: f.amount });

const categoriesOf = (cats: Category[]) => new Set(cats);

describe("invariants that hold for every fixture", () => {
  for (const f of ALL_FIXTURES) {
    it(`${f.name}: distribution is valid and the pick is the EV winner`, () => {
      const r = run(f);
      // Probabilities sum to ~1 and are sorted descending.
      const sum = r.prediction.candidates.reduce((s, c) => s + c.p, 0);
      expect(sum).toBeCloseTo(1, 5);
      const ps = r.prediction.candidates.map((c) => c.p);
      expect([...ps].sort((a, b) => b - a)).toEqual(ps);
      // The recommended card is always the expected-value winner.
      expect(r.recommendedCardId).toBe(r.score.winner.cardId);
      // EV winner has the max expected value among accepted cards.
      const maxEv = Math.max(...r.score.ranked.map((s) => s.expectedValueDollars));
      expect(r.score.winner.expectedValueDollars).toBeCloseTo(maxEv, 10);
    });
  }
});

describe("Walmart razor — big-box: recommend on merchant MCC, item irrelevant", () => {
  const r = run(WALMART_RAZOR);

  it("recommends the catch-all, not a beauty/grocery card", () => {
    // Grocery only pays off if it rings up as groceries (20% likely after the
    // razor nudges discount up), so the flat 2% everywhere card wins on EV.
    expect(r.recommendedCardId).toBe("everywhere_2");
  });

  it("never invents a category the merchant won't code", () => {
    const cats = categoriesOf(r.prediction.candidates.map((c) => c.category));
    // Walmart's own MCCs only — a razor must NOT introduce beauty/drugstore.
    expect([...cats].every((c) => c === "discount" || c === "groceries")).toBe(true);
    expect(cats.has("beauty")).toBe(false);
    expect(cats.has("drugstore")).toBe(false);
  });

  it("is flagged big-box and explains the item is irrelevant", () => {
    expect(r.prediction.flags.bigBox).toBe(true);
    expect(r.explanation.detail.toLowerCase()).toContain("big-box");
    expect(r.explanation.detail.toLowerCase()).toContain("item type");
  });

  it("is not a coin-flip, but confidence is below HIGH so we disclose", () => {
    expect(r.prediction.ambiguous).toBe(false);
    expect(r.prediction.topConfidence).toBeLessThan(DEFAULT_CONFIG.HIGH_CONFIDENCE);
    expect(r.gating.surfaceUncertainty).toBe(true);
  });

  it("the recommendation is STABLE regardless of the item type", () => {
    // The razor must not change the pick vs an empty cart at the same store.
    const empty = recommend({
      context: { merchantKey: "walmart" },
      wallet: SAMPLE_WALLET,
      amount: WALMART_RAZOR.amount,
    });
    expect(empty.recommendedCardId).toBe(r.recommendedCardId);
  });
});

describe("Walmart groceries — cart nudges the prior WITHIN Walmart's MCCs", () => {
  const r = run(WALMART_GROCERIES);

  it("a grocery-heavy cart can tip the pick to the grocery card", () => {
    expect(r.recommendedCardId).toBe("grocery_hero");
    expect(r.prediction.candidates[0]!.category).toBe("groceries");
  });

  it("still never leaves Walmart's own candidate categories", () => {
    const cats = categoriesOf(r.prediction.candidates.map((c) => c.category));
    expect([...cats].every((c) => c === "discount" || c === "groceries")).toBe(true);
  });
});

describe("Costco — wholesale warehouse vs the minority fuel pump", () => {
  it("warehouse codes as wholesale; catch-all wins (no card bonuses wholesale)", () => {
    const r = run(COSTCO_WAREHOUSE);
    expect(r.prediction.candidates[0]!.mcc).toBe("5300");
    expect(r.recommendedCardId).toBe("everywhere_2");
    expect(r.prediction.topConfidence).toBeGreaterThanOrEqual(
      DEFAULT_CONFIG.HIGH_CONFIDENCE,
    );
    expect(r.gating.surfaceUncertainty).toBe(false); // clean
  });

  it("enforces Costco's Visa-only acceptance (Mastercard/Amex filtered out)", () => {
    const r = run(COSTCO_WAREHOUSE);
    const ranked = r.score.ranked.map((s) => s.cardId);
    expect(ranked).not.toContain("grocery_hero"); // mastercard
    expect(ranked).not.toContain("dining_4"); // amex
    expect(r.prediction.acceptedNetworks).toEqual(["visa"]);
  });

  it("the fuel sub-venue flips the same merchant to gas", () => {
    const r = run(COSTCO_GAS);
    expect(r.prediction.candidates[0]!.mcc).toBe("5542");
    expect(r.recommendedCardId).toBe("gas_4");
    expect(r.prediction.ambiguous).toBe(false); // sub-venue known
  });
});

describe("Hotel sundry candy bar — host-venue bleed keeps it lodging", () => {
  const r = run(HOTEL_CANDY);

  it("codes as lodging, NOT convenience, and recommends the travel card", () => {
    expect(r.prediction.candidates[0]!.mcc).toBe("7011");
    expect(r.prediction.candidates[0]!.category).toBe("lodging");
    expect(r.recommendedCardId).toBe("travel_4");
  });

  it("explicitly ignores the candy item signal (host bleed)", () => {
    expect(r.prediction.flags.hostVenue).toBe(true);
    expect(r.prediction.signalsUsed.some((s) => s.includes("host-venue bleed"))).toBe(
      true,
    );
    // Convenience never becomes the dominant candidate.
    const conv = r.prediction.candidates.find((c) => c.category === "convenience");
    const lodging = r.prediction.candidates.find((c) => c.category === "lodging")!;
    expect((conv?.p ?? 0)).toBeLessThan(lodging.p);
  });
});

describe("Gas station + attached Burger King — composite → split recommendation", () => {
  const r = run(GAS_QSR_COMPOSITE);

  it("is ambiguous and composite", () => {
    expect(r.prediction.flags.composite).toBe(true);
    expect(r.prediction.ambiguous).toBe(true);
  });

  it("recommends the EV winner but surfaces the conditional alternative", () => {
    // gas slightly favored at the pump → gas card wins EV; dining card is the
    // 'if it's the restaurant' alternative.
    expect(r.recommendedCardId).toBe("gas_4");
    expect(r.gating.surfaceUncertainty).toBe(true);
    expect(r.gating.alternativeCardId).toBe("dining_4");
    expect(r.gating.alternativeForMcc).toBe("5814");
  });

  it("winner genuinely flips by MCC (gas → gas card, fast food → dining card)", () => {
    expect(r.score.winnerByMcc["5542"]).toBe("gas_4");
    expect(r.score.winnerByMcc["5814"]).toBe("dining_4");
  });

  it("the explanation gives the at-pump / inside split", () => {
    expect(r.explanation.uncertaintyNote?.toLowerCase()).toContain("composite");
    expect(r.explanation.uncertaintyNote).toContain("Fuel Saver 4%");
    expect(r.explanation.uncertaintyNote).toContain("Dining Plus 4%");
  });
});

describe("Food truck — mobile prior → catch-all wins via expected value", () => {
  const r = run(FOOD_TRUCK);

  it("recommends the robust catch-all", () => {
    expect(r.recommendedCardId).toBe("everywhere_2");
  });

  it("is flagged mobile, ambiguous, and low confidence", () => {
    expect(r.prediction.flags.mobileVendor).toBe(true);
    expect(r.prediction.ambiguous).toBe(true);
    expect(r.prediction.topConfidence).toBeLessThan(DEFAULT_CONFIG.LOW_CONFIDENCE);
    expect(r.gating.surfaceUncertainty).toBe(true);
  });
});

describe("Clean grocery store — single MCC, high confidence, clean rec", () => {
  const r = run(CLEAN_GROCERY);

  it("recommends the grocery card cleanly", () => {
    expect(r.prediction.candidates[0]!.mcc).toBe("5411");
    expect(r.recommendedCardId).toBe("grocery_hero");
    expect(r.prediction.ambiguous).toBe(false);
    expect(r.prediction.topConfidence).toBeGreaterThanOrEqual(
      DEFAULT_CONFIG.HIGH_CONFIDENCE,
    );
    expect(r.gating.surfaceUncertainty).toBe(false);
  });

  it("explains the basis and shows value over the catch-all", () => {
    expect(r.explanation.headline).toContain("Grocery Hero 5%");
    expect(r.explanation.headline.toLowerCase()).toContain("groceries");
  });
});

describe("Unknown online merchant — fail safe to catch-all at low confidence", () => {
  const r = run(UNKNOWN_ONLINE);

  it("recommends the catch-all and never a confident wrong category", () => {
    expect(r.recommendedCardId).toBe("everywhere_2");
    expect(r.prediction.candidates[0]!.mcc).toBe("0000");
    expect(r.prediction.topConfidence).toBeLessThan(DEFAULT_CONFIG.LOW_CONFIDENCE);
    expect(r.gating.surfaceUncertainty).toBe(true);
    expect(r.explanation.detail.toLowerCase()).toContain("couldn't identify");
  });
});
