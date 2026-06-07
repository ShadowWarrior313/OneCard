import { describe, it, expect } from "vitest";
import { scoreCards } from "./score.js";
import type { Card } from "./rewards-rules.js";
import type { MccPrediction } from "../mcc/predict.js";
import { EVERYWHERE_2, GROCERY_HERO } from "../data/cards.sample.js";
import { categoryForMcc, labelForMcc } from "../mcc/mcc-catalog.js";

/** Build a minimal prediction with explicit probabilities for EV control. */
function prediction(probs: Record<string, number>): MccPrediction {
  const candidates = Object.entries(probs)
    .map(([mcc, p]) => ({ mcc, label: labelForMcc(mcc), category: categoryForMcc(mcc), p }))
    .sort((a, b) => b.p - a.p);
  return {
    candidates,
    topConfidence: candidates[0]!.p,
    ambiguous: false,
    flags: { composite: false, hostVenue: false, bigBox: false, mobileVendor: false },
    signalsUsed: [],
    merchantName: "Test Merchant",
  };
}

describe("expected-value scoring across the MCC distribution", () => {
  const wallet = [EVERYWHERE_2, GROCERY_HERO];

  it("EV = amount × Σ p(mcc) × rate(mcc)", () => {
    // 60% groceries, 40% discount. Grocery Hero: 0.6×5% + 0.4×1% = 3.4%.
    const r = scoreCards(prediction({ "5411": 0.6, "5310": 0.4 }), wallet, {
      amount: 100,
    });
    const gh = r.ranked.find((s) => s.cardId === "grocery_hero")!;
    expect(gh.expectedRate).toBeCloseTo(0.034, 6);
    expect(gh.expectedValueDollars).toBeCloseTo(3.4, 6);
    expect(r.winner.cardId).toBe("grocery_hero"); // 3.4% > 2%
  });

  it("catch-all wins when the bonus category is only sometimes likely", () => {
    // 20% groceries: Grocery Hero EV = 0.2×5% + 0.8×1% = 1.8% < 2% flat.
    const r = scoreCards(prediction({ "5411": 0.2, "5310": 0.8 }), wallet, {
      amount: 100,
    });
    expect(r.winner.cardId).toBe("everywhere_2");
    expect(r.winner.expectedRate).toBeCloseTo(0.02, 6);
  });

  it("category card wins when the category is reliably likely", () => {
    const r = scoreCards(prediction({ "5411": 0.95, "5499": 0.05 }), wallet, {
      amount: 100,
    });
    expect(r.winner.cardId).toBe("grocery_hero");
  });

  it("reports the per-MCC breakdown and the EV gap to #2", () => {
    const r = scoreCards(prediction({ "5411": 0.6, "5310": 0.4 }), wallet, {
      amount: 100,
    });
    expect(r.winner.perMcc).toHaveLength(2);
    expect(r.evGapToSecondDollars).toBeCloseTo(
      r.winner.expectedValueDollars - r.runnerUp!.expectedValueDollars,
      6,
    );
  });
});

describe("cap blending", () => {
  // A 5% groceries card capped at $50 of spend per period, base 1%.
  const CAPPED: Card = {
    cardId: "capped",
    displayName: "Capped Grocery 5% (≤$50)",
    issuer: "Sample Bank",
    network: "visa",
    program: {
      programId: "capped",
      baseRate: 0.01,
      rates: { groceries: { rate: 0.05, capPerPeriod: 50 } },
    },
  };

  it("earns the full bonus under the cap", () => {
    const r = scoreCards(prediction({ "5411": 1 }), [CAPPED], { amount: 40 });
    expect(r.winner.expectedRate).toBeCloseTo(0.05, 6);
  });

  it("blends bonus and base when the purchase straddles the cap", () => {
    // $40 already spent, $40 more: $10 at 5% + $30 at 1% over $40 → 2% blended.
    const r = scoreCards(prediction({ "5411": 1 }), [CAPPED], {
      amount: 40,
      priorSpend: { capped: { groceries: 40 } },
    });
    expect(r.winner.expectedRate).toBeCloseTo(0.02, 6);
  });

  it("drops to base once the cap is exhausted", () => {
    const r = scoreCards(prediction({ "5411": 1 }), [CAPPED], {
      amount: 40,
      priorSpend: { capped: { groceries: 50 } },
    });
    expect(r.winner.expectedRate).toBeCloseTo(0.01, 6);
  });
});

describe("network acceptance", () => {
  it("filters out cards the merchant doesn't accept", () => {
    const r = scoreCards(prediction({ "5411": 1 }), [EVERYWHERE_2, GROCERY_HERO], {
      amount: 100,
      acceptedNetworks: ["visa"], // Grocery Hero is Mastercard
    });
    expect(r.ranked.map((s) => s.cardId)).toEqual(["everywhere_2"]);
  });

  it("throws only when NO card is usable", () => {
    expect(() =>
      scoreCards(prediction({ "5411": 1 }), [GROCERY_HERO], {
        amount: 100,
        acceptedNetworks: ["amex"],
      }),
    ).toThrow(/no usable card/);
  });
});
