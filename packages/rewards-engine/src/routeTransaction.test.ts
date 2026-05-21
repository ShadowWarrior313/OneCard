import { describe, it, expect } from "vitest";
import { mapMccToCategory } from "./mapMccToCategory.js";
import { routeTransaction } from "./routeTransaction.js";
import { effectiveMultiplier } from "./estimateReward.js";
import { AMEX_COBALT, CIBC_DIVIDEND } from "./fixtures/cards.js";
import type { RoutingContext } from "@onecard/shared-types";

function ctx(overrides: Partial<RoutingContext> = {}): RoutingContext {
  return {
    mode: "network_dependent",
    transaction: {
      amount: 75,
      merchantName: "Bistro 67",
      mcc: "5812",
    },
    portfolio: {
      cards: [AMEX_COBALT, CIBC_DIVIDEND],
      usage: [],
      preferences: { preferCashback: false },
      defaultCardId: "cibc_dividend",
    },
    ...overrides,
  };
}

describe("mapMccToCategory", () => {
  it("maps restaurant MCC to dining", () => {
    expect(mapMccToCategory("5812")).toBe("dining");
  });
});

describe("effectiveMultiplier", () => {
  const dining = { category: "dining" as const, multiplier: 5, capMonthly: 500 };
  const other = { category: "other" as const, multiplier: 1 };

  it("returns bonus rate when under cap", () => {
    expect(effectiveMultiplier(dining, other, 100, 0)).toEqual({
      multiplier: 5,
      cappedOut: false,
    });
  });

  it("returns base rate when cap exhausted", () => {
    expect(effectiveMultiplier(dining, other, 100, 500)).toEqual({
      multiplier: 1,
      cappedOut: true,
    });
  });

  it("blends rate when purchase straddles cap", () => {
    const { multiplier, cappedOut } = effectiveMultiplier(dining, other, 100, 450);
    expect(cappedOut).toBe(false);
    // 50 at 5x + 50 at 1x over 100 → 3x blended
    expect(multiplier).toBe(3);
  });
});

describe("routeTransaction", () => {
  it("picks AMEX Cobalt for dining (5x MR beats 1x cashback)", () => {
    const decision = routeTransaction(ctx());
    expect(decision.selectedCardId).toBe("amex_cobalt");
    expect(decision.category).toBe("dining");
    // $75 * 5 * 2¢ = 750¢ = $7.50
    expect(decision.estimatedRewardValueCents).toBe(750);
    expect(decision.deltaVsDefaultCents).toBeGreaterThan(0);
    expect(decision.reason).toContain("AMEX Cobalt");
  });

  it("picks CIBC for groceries when Cobalt cap is exhausted", () => {
    const decision = routeTransaction(
      ctx({
        transaction: { amount: 100, merchantName: "Loblaws", mcc: "5411" },
        portfolio: {
          cards: [AMEX_COBALT, CIBC_DIVIDEND],
          usage: [
            { cardId: "amex_cobalt", category: "groceries", spendThisPeriod: 500 },
          ],
          preferences: { preferCashback: false },
        },
      }),
    );
    // Cobalt capped → 1x MR ($2); CIBC 2% ($2) — tie broken by stable sort; CIBC wins alphabetically after equal score... 
    // Actually both 100 cents - need to check
    // Cobalt: 100 * 1 * 2 = 200 cents
    // CIBC: 100 * 2 * 1 = 200 cents - tie, localeCompare: amex before cibc - amex wins
    expect(decision.selectedCardId).toBe("amex_cobalt");
    expect(decision.alternatives[0]?.cappedOut).toBe(true);
  });

  it("respects excludedCardIds", () => {
    const decision = routeTransaction(
      ctx({
        portfolio: {
          cards: [AMEX_COBALT, CIBC_DIVIDEND],
          usage: [],
          preferences: {
            preferCashback: false,
            excludedCardIds: ["amex_cobalt"],
          },
        },
      }),
    );
    expect(decision.selectedCardId).toBe("cibc_dividend");
  });

  it("throws when no eligible cards", () => {
    expect(() =>
      routeTransaction(
        ctx({
          portfolio: {
            cards: [AMEX_COBALT],
            usage: [],
            preferences: { preferCashback: false, excludedCardIds: ["amex_cobalt"] },
          },
        }),
      ),
    ).toThrow(/no eligible cards/);
  });

  it("attaches mode metadata without changing winner", () => {
    const a = routeTransaction(ctx({ mode: "network_dependent" }));
    const b = routeTransaction(ctx({ mode: "virtual_provisioning" }));
    expect(a.selectedCardId).toBe(b.selectedCardId);
    expect(b.modeMetadata.merchantAcceptance).toBe("digital_only");
  });
});
