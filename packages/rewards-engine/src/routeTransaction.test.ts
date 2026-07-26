import { describe, it, expect } from "vitest";
import { mapMccToCategory } from "./mapMccToCategory.js";
import { routeTransaction } from "./routeTransaction.js";
import { effectiveMultiplier } from "./estimateReward.js";
import { AMEX_COBALT, CIBC_DIVIDEND } from "./fixtures/cards.js";
import type { CardProduct, RoutingContext } from "@onecard/shared-types";

const SCOTIA_SCENE: CardProduct = {
  cardId: "scotia_scene",
  issuer: "Scotiabank",
  displayName: "Scotiabank Scene+ Visa Card",
  currency: "Scene+ points",
  pointValueCents: 1,
  network: "visa",
  rewards: [
    { category: "other", multiplier: 1 },
    {
      category: "groceries",
      multiplier: 2,
      merchantIds: ["sobeys", "freshco"],
    },
    { category: "other", multiplier: 2, merchantIds: ["cineplex"] },
  ],
};

const TD_AEROPLAN: CardProduct = {
  cardId: "td_aeroplan_infinite",
  issuer: "TD",
  displayName: "TD Aeroplan Visa Infinite Card",
  currency: "Aeroplan points",
  pointValueCents: 2,
  network: "visa",
  rewards: [
    { category: "other", multiplier: 1 },
    { category: "gas", multiplier: 1.5 },
    { category: "groceries", multiplier: 1.5 },
    { category: "travel", multiplier: 1.5 },
  ],
};

const PC_WORLD_ELITE: CardProduct = {
  cardId: "pc_world_elite_mc",
  issuer: "PC Financial",
  displayName: "PC World Elite Mastercard",
  currency: "PC Optimum points",
  pointValueCents: 1,
  network: "mastercard",
  rewards: [
    { category: "other", multiplier: 1 },
    {
      category: "groceries",
      multiplier: 4.5,
      merchantIds: ["loblaws", "no_frills"],
    },
  ],
};

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

  it("maps utilities to recurring_bills", () => {
    expect(mapMccToCategory("4900")).toBe("recurring_bills");
  });

  it("maps supermarket MCCs to groceries but not convenience 5499", () => {
    expect(mapMccToCategory("5411")).toBe("groceries");
    expect(mapMccToCategory("5462")).toBe("groceries");
    // 5499 = misc food / convenience — must not inherit grocery bonuses
    expect(mapMccToCategory("5499")).toBe("other");
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
        transaction: {
          amount: 100,
          merchantName: "Sobeys",
          mcc: "5411",
          merchantId: "sobeys",
          category: "groceries",
        },
        portfolio: {
          cards: [AMEX_COBALT, CIBC_DIVIDEND],
          usage: [
            { cardId: "amex_cobalt", category: "groceries", spendThisPeriod: 2500 },
          ],
          preferences: { preferCashback: false },
        },
      }),
    );
    expect(decision.selectedCardId).toBe("amex_cobalt");
    expect(decision.alternatives[0]?.cappedOut).toBe(true);
  });

  it("routes Cineplex to Scotiabank Scene+ partner bonus", () => {
    const decision = routeTransaction(
      ctx({
        transaction: {
          amount: 50,
          merchantName: "Cineplex",
          mcc: "7832",
          merchantId: "cineplex",
          category: "other",
        },
        portfolio: {
          cards: [SCOTIA_SCENE, CIBC_DIVIDEND],
          usage: [],
          preferences: { preferCashback: false },
        },
      }),
    );
    expect(decision.selectedCardId).toBe("scotia_scene");
    expect(decision.multiplier).toBe(2);
  });

  it("excludes Amex at Loblaws and picks PC Financial", () => {
    const decision = routeTransaction(
      ctx({
        transaction: {
          amount: 100,
          merchantName: "Loblaws",
          mcc: "5411",
          merchantId: "loblaws",
          category: "groceries",
        },
        portfolio: {
          cards: [AMEX_COBALT, PC_WORLD_ELITE],
          usage: [],
          preferences: { preferCashback: false },
        },
      }),
    );
    expect(decision.selectedCardId).toBe("pc_world_elite_mc");
  });

  it("picks TD Aeroplan for gas over Amex Cobalt base rate", () => {
    const decision = routeTransaction(
      ctx({
        transaction: {
          amount: 80,
          merchantName: "Petro-Canada",
          mcc: "5541",
          merchantId: "petro_canada",
          category: "gas",
        },
        portfolio: {
          cards: [AMEX_COBALT, TD_AEROPLAN],
          usage: [],
          preferences: { preferCashback: false },
        },
      }),
    );
    expect(decision.selectedCardId).toBe("td_aeroplan_infinite");
    expect(decision.multiplier).toBe(1.5);
  });

  it("does not apply grocery bonuses to convenience MCC 5499", () => {
    const decision = routeTransaction(
      ctx({
        transaction: {
          amount: 40,
          merchantName: "Corner Convenience",
          mcc: "5499",
        },
        portfolio: {
          cards: [AMEX_COBALT, CIBC_DIVIDEND],
          usage: [],
          preferences: { preferCashback: false },
        },
      }),
    );
    expect(decision.category).toBe("other");
    // Cobalt grocery is 5×; convenience must earn base (1×), not grocery.
    expect(decision.multiplier).toBe(1);
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
