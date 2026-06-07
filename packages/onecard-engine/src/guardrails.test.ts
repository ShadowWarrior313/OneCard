import { describe, it, expect } from "vitest";
import { recommend } from "./recommend.js";
import { SAMPLE_WALLET } from "./data/cards.sample.js";
import { MERCHANTS } from "./mcc/merchant-mcc-map.js";

/**
 * Guardrails: this module is recommend-only. It must never store card numbers /
 * CVV, and recommend() must be a pure advice function with no payment side
 * effects (no charging, proxying, or back-to-back funding).
 */

const FORBIDDEN_KEY = /pan|cardnumber|card_number|cvv|cvc|expiry|expiration|track2|secret/i;

describe("no sensitive payment-instrument data is stored", () => {
  it("sample wallet stores only identity + reward rules — no PAN/CVV", () => {
    for (const card of SAMPLE_WALLET) {
      const keys = JSON.stringify(card).match(/"([^"]+)":/g) ?? [];
      for (const k of keys) {
        expect(k).not.toMatch(FORBIDDEN_KEY);
      }
    }
  });
});

describe("recommend() is pure advice with no side effects", () => {
  it("does not mutate its inputs", () => {
    const wallet = structuredClone(SAMPLE_WALLET);
    const before = JSON.stringify(wallet);
    const ctx = { merchantKey: "walmart" as const };
    const ctxBefore = JSON.stringify(ctx);

    recommend({ context: ctx, wallet, amount: 25 });

    expect(JSON.stringify(wallet)).toBe(before);
    expect(JSON.stringify(ctx)).toBe(ctxBefore);
  });

  it("returns advice only — a recommended card id, never a charge/transaction", () => {
    const r = recommend({ context: { merchantKey: "safeway" }, wallet: SAMPLE_WALLET, amount: 50 });
    expect(typeof r.recommendedCardId).toBe("string");
    // The result is purely descriptive: prediction + score + gating + explanation.
    expect(Object.keys(r).sort()).toEqual(
      ["explanation", "gating", "prediction", "recommendedCardId", "score"].sort(),
    );
    // No field implies money movement.
    const blob = JSON.stringify(r).toLowerCase();
    expect(blob).not.toContain("charged");
    expect(blob).not.toContain("authorize");
    expect(blob).not.toContain("settlement");
  });
});

describe("curated merchant data is well-formed", () => {
  it("every merchant's priors sum to ~1", () => {
    for (const m of MERCHANTS) {
      const sum = Object.values(m.priors).reduce((s, p) => s + p, 0);
      expect(sum).toBeCloseTo(1, 6);
      for (const [venue, dist] of Object.entries(m.subVenues ?? {})) {
        const vs = Object.values(dist).reduce((s, p) => s + p, 0);
        expect(vs, `${m.key}/${venue}`).toBeCloseTo(1, 6);
      }
    }
  });
});
