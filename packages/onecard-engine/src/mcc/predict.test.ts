import { describe, it, expect } from "vitest";
import { predictMcc } from "./predict.js";
import { DEFAULT_CONFIG } from "../config.js";

describe("predictMcc returns a distribution, not a single guess", () => {
  it("produces ranked candidates that sum to ~1 with a topConfidence", () => {
    const p = predictMcc({ merchantKey: "walmart" });
    expect(p.candidates.length).toBeGreaterThan(1);
    expect(p.candidates.reduce((s, c) => s + c.p, 0)).toBeCloseTo(1, 5);
    const ps = p.candidates.map((c) => c.p);
    expect([...ps].sort((a, b) => b - a)).toEqual(ps);
    expect(p.topConfidence).toBeGreaterThan(0);
    expect(p.topConfidence).toBeLessThanOrEqual(1);
  });

  it("resolves merchants by domain and by name, not just key", () => {
    expect(predictMcc({ domain: "https://www.walmart.com/cart" }).merchantName).toBe(
      "Walmart",
    );
    expect(predictMcc({ merchantName: "Local Costco #221" }).merchantName).toBe(
      "Costco Wholesale",
    );
  });

  it("fails safe on unknown merchants: low confidence, single 'other' candidate", () => {
    const p = predictMcc({ merchantName: "Totally Unknown LLC" });
    expect(p.candidates[0]!.mcc).toBe("0000");
    expect(p.candidates[0]!.category).toBe("other");
    expect(p.topConfidence).toBeLessThan(DEFAULT_CONFIG.LOW_CONFIDENCE);
    expect(p.ambiguous).toBe(false);
  });
});

describe("big-box invariant: cart items adjust the prior, never invent a category", () => {
  it("a razor at Walmart can only shift discount-vs-grocery, never add beauty", () => {
    const p = predictMcc({
      merchantKey: "walmart",
      online: { cartItemNames: ["Gillette razor", "shaving cream"] },
    });
    const cats = new Set(p.candidates.map((c) => c.category));
    expect([...cats].every((c) => c === "discount" || c === "groceries")).toBe(true);
    expect(cats.has("beauty")).toBe(false);
    expect(cats.has("drugstore")).toBe(false);
    // The razor nudges toward discount (general merchandise), staying a Walmart MCC.
    const discount = p.candidates.find((c) => c.category === "discount")!;
    expect(discount.p).toBeGreaterThan(0.5);
  });

  it("records when an item suggests a category the merchant doesn't code", () => {
    // At a clean grocer, a 'laptop' hint maps to electronics/discount — neither
    // is a candidate there — so it must be ignored, not invented.
    const p = predictMcc({
      merchantKey: "safeway",
      online: { cartItemNames: ["laptop"] },
    });
    const cats = new Set(p.candidates.map((c) => c.category));
    expect(cats.has("electronics")).toBe(false);
    expect(p.signalsUsed.some((s) => s.includes("not coded by this merchant"))).toBe(
      true,
    );
  });
});

describe("ambiguity flags", () => {
  it("marks a genuine coin-flip composite venue ambiguous", () => {
    const p = predictMcc({ merchantKey: "mobil_bk" });
    expect(p.flags.composite).toBe(true);
    expect(p.ambiguous).toBe(true);
  });

  it("a known sub-venue resolves the ambiguity", () => {
    const p = predictMcc({ merchantKey: "mobil_bk", subVenue: "fuel" });
    expect(p.ambiguous).toBe(false);
    expect(p.candidates[0]!.mcc).toBe("5542");
  });

  it("does not mark a peaked distribution (clean grocer) ambiguous", () => {
    expect(predictMcc({ merchantKey: "safeway" }).ambiguous).toBe(false);
  });
});

describe("name-match whole-token guard for short brand fragments", () => {
  it("does not classify telecom MOBILITY / MOBILE / AUTOMOBILE as Mobil gas", () => {
    for (const merchantName of [
      "BELL MOBILITY #123",
      "ROGERS MOBILITY",
      "TELUS MOBILITY",
      "MOBILE DETAILING TORONTO",
      "CAA AUTOMOBILE CLUB",
    ]) {
      const p = predictMcc({ merchantName, channel: "in_person" });
      expect(p.signalsUsed.some((s) => s.includes("merchant:mobil_bk"))).toBe(false);
      expect(p.candidates[0]!.mcc).not.toBe("5542");
    }
  });

  it("still resolves real Mobil / ExxonMobil pump descriptors", () => {
    expect(predictMcc({ merchantName: "MOBIL STATION 4421" }).merchantName).toBe(
      "Mobil + Burger King (truck stop)",
    );
    expect(predictMcc({ merchantName: "EXXONMOBIL" }).merchantName).toBe(
      "Mobil + Burger King (truck stop)",
    );
    expect(predictMcc({ merchantName: "MOBIL #889" }).candidates[0]!.mcc).toBe("5542");
  });

  it("does not classify TARGETED… as Target big-box", () => {
    const p = predictMcc({ merchantName: "TARGETED MARKETING INC", channel: "in_person" });
    expect(p.signalsUsed.some((s) => s.includes("merchant:target"))).toBe(false);
  });
});
