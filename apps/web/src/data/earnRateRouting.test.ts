import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RewardRule, RoutingContext } from "@onecard/shared-types";
import { SCENE_GROCERY_MERCHANTS } from "./merchantPartners.ts";
import snapshot from "./cardRewards.snapshot.json" with { type: "json" };

type SnapshotCard = {
  id: string;
  issuer: string;
  name: string;
  annualFee?: number;
  network?: CardProduct["network"];
  pointValueCAD: number;
  currency: string;
  rewards: RewardRule[];
};

function product(id: string): CardProduct {
  const entry = (snapshot as SnapshotCard[]).find((card) => card.id === id);
  assert.ok(entry, `missing snapshot card ${id}`);
  return {
    cardId: entry.id,
    issuer: entry.issuer,
    displayName: entry.name,
    annualFee: entry.annualFee,
    currency: entry.currency,
    pointValueCents: Math.round(entry.pointValueCAD * 10000) / 100,
    network: entry.network,
    rewards: entry.rewards,
  };
}

function route(
  cards: CardProduct[],
  transaction: RoutingContext["transaction"],
) {
  return routeTransaction({
    mode: "virtual_provisioning",
    transaction,
    portfolio: { cards, usage: [], preferences: { preferCashback: false } },
  });
}

const AIR_CANADA = {
  amount: 1000,
  merchantName: "Air Canada",
  mcc: "3000",
  merchantId: "air_canada",
  category: "travel" as const,
};

describe("portal-only travel bonuses that previously inverted winners", () => {
  it("does not apply Scotia Passport 3× to direct airline bookings", () => {
    const passport = product("scotia_passport");
    assert.equal(getRewardRule(passport, "travel", "air_canada").multiplier, 1);
    assert.equal(getRewardRule(passport, "dining").multiplier, 2);
    assert.equal(getRewardRule(passport, "groceries", "metro").multiplier, 2);
    const partner = passport.rewards.find(
      (rule) => rule.category === "groceries" && rule.merchantIds?.length,
    );
    assert.deepEqual(partner?.merchantIds, [...SCENE_GROCERY_MERCHANTS]);
    assert.equal(partner?.multiplier, 3);
    assert.equal(getRewardRule(passport, "groceries", "sobeys").multiplier, 3);
  });

  it("picks Cobalt over Passport on a direct Air Canada booking", () => {
    const decision = route(
      [product("scotia_passport"), product("amex_cobalt")],
      AIR_CANADA,
    );
    assert.equal(decision.selectedCardId, "amex_cobalt");
    assert.equal(getRewardRule(product("scotia_passport"), "travel", "air_canada").multiplier, 1);
  });

  it("limits CIBC Dividend Platinum 2% travel to CIBC by Expedia", () => {
    const platinum = product("cibc_dividend_platinum");
    assert.equal(getRewardRule(platinum, "travel", "expedia").multiplier, 2);
    assert.equal(getRewardRule(platinum, "travel", "air_canada").multiplier, 1);
    assert.equal(getRewardRule(platinum, "transportation").multiplier, 2);
  });

  it("picks Avion over Dividend Platinum on a direct Air Canada booking", () => {
    const decision = route(
      [product("cibc_dividend_platinum"), product("rbc_avion_infinite")],
      AIR_CANADA,
    );
    assert.equal(decision.selectedCardId, "rbc_avion_infinite");
  });

  it("limits Aventura Infinite 2× travel to CIBC by Expedia and uses 1× base", () => {
    const aventura = product("cibc_aventura_infinite");
    assert.equal(getRewardRule(aventura, "travel", "expedia").multiplier, 2);
    assert.equal(getRewardRule(aventura, "travel", "air_canada").multiplier, 1);
    assert.equal(getRewardRule(aventura, "dining").multiplier, 1);
    assert.equal(getRewardRule(aventura, "groceries").multiplier, 1.5);
    assert.equal(getRewardRule(aventura, "gas").multiplier, 1.5);
    assert.equal(getRewardRule(aventura, "other").multiplier, 1);
  });

  it("picks Cobalt over Aventura Infinite on a direct Air Canada booking", () => {
    const decision = route(
      [product("cibc_aventura_infinite"), product("amex_cobalt")],
      AIR_CANADA,
    );
    assert.equal(decision.selectedCardId, "amex_cobalt");
  });

  it("picks Avion over Aventura Infinite at Amazon (base 1× vs 1.5× overstatement)", () => {
    const decision = route(
      [product("cibc_aventura_infinite"), product("rbc_avion_infinite")],
      {
        amount: 100,
        merchantName: "Amazon.ca",
        mcc: "5399",
        merchantId: "amazon",
        category: "other",
      },
    );
    assert.equal(decision.selectedCardId, "rbc_avion_infinite");
  });

  it("picks Aventura Infinite over Avion on CIBC by Expedia", () => {
    const decision = route(
      [product("cibc_aventura_infinite"), product("rbc_avion_infinite")],
      {
        amount: 1000,
        merchantName: "Expedia",
        mcc: "4722",
        merchantId: "expedia",
        category: "travel",
      },
    );
    assert.equal(decision.selectedCardId, "cibc_aventura_infinite");
    assert.equal(decision.multiplier, 2);
  });
});
