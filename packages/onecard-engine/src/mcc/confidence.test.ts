import { describe, it, expect } from "vitest";
import { recommend } from "../recommend.js";
import { SAMPLE_WALLET } from "../data/cards.sample.js";
import { GAS_QSR_COMPOSITE } from "../data/fixtures/index.js";

/**
 * Gating only controls how much uncertainty is surfaced. In BOTH modes the
 * underlying pick is the same expected-value winner.
 */
describe("gating modes", () => {
  const base = {
    context: GAS_QSR_COMPOSITE.context,
    wallet: SAMPLE_WALLET,
    amount: GAS_QSR_COMPOSITE.amount,
  };

  it("confidence_gated (default) surfaces uncertainty on an ambiguous merchant", () => {
    const r = recommend(base);
    expect(r.gating.mode).toBe("confidence_gated");
    expect(r.gating.surfaceUncertainty).toBe(true);
    expect(r.gating.alternativeCardId).toBe("dining_4");
  });

  it("always_silent shows only the single pick — same EV winner, no uncertainty UI", () => {
    const r = recommend({ ...base, config: { GATING_MODE: "always_silent" } });
    expect(r.gating.mode).toBe("always_silent");
    expect(r.gating.surfaceUncertainty).toBe(false);
    expect(r.gating.alternativeCardId).toBeUndefined();
    // Crucially, the pick itself is identical to the gated mode.
    expect(r.recommendedCardId).toBe(recommend(base).recommendedCardId);
  });

  it("threshold overrides change disclosure without changing the pick", () => {
    // Raising HIGH_CONFIDENCE makes a borderline-high case disclose instead.
    const strict = recommend({
      context: { merchantKey: "costco", subVenue: "fuel" },
      wallet: SAMPLE_WALLET,
      amount: 60,
      config: { HIGH_CONFIDENCE: 0.95 },
    });
    const lenient = recommend({
      context: { merchantKey: "costco", subVenue: "fuel" },
      wallet: SAMPLE_WALLET,
      amount: 60,
    });
    expect(strict.recommendedCardId).toBe(lenient.recommendedCardId); // same pick
    expect(strict.gating.surfaceUncertainty).toBe(true); // 0.81 < 0.95 now discloses
    expect(lenient.gating.surfaceUncertainty).toBe(false); // 0.81 ≥ 0.80 was clean
  });
});
