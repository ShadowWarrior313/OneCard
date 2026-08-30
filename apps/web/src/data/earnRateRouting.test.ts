import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RewardRule, RoutingContext } from "@onecard/shared-types";
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
  usage: RoutingContext["portfolio"]["usage"] = [],
) {
  return routeTransaction({
    mode: "virtual_provisioning",
    transaction,
    portfolio: { cards, usage, preferences: { preferCashback: false } },
  });
}

const SHELL = {
  amount: 80,
  merchantName: "Shell",
  mcc: "5541",
  merchantId: "shell",
  category: "gas" as const,
};

const UBER = {
  amount: 40,
  merchantName: "Uber",
  mcc: "4121",
  merchantId: "uber",
  category: "transportation" as const,
};

const METRO = {
  amount: 80,
  merchantName: "Metro",
  mcc: "5411",
  merchantId: "metro",
  category: "groceries" as const,
};

describe("Amex Cobalt issuer earn table", () => {
  it("earns 2× at gas and local transit, not the 1× base rate", () => {
    const cobalt = product("amex_cobalt");
    assert.equal(getRewardRule(cobalt, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(cobalt, "transportation", "uber").multiplier, 2);
    assert.equal(getRewardRule(cobalt, "dining").multiplier, 5);
    assert.equal(getRewardRule(cobalt, "groceries", "metro").multiplier, 5);
  });

  it("shares one $2,500 monthly cap across groceries and dining", () => {
    const cobalt = product("amex_cobalt");
    const grocery = getRewardRule(cobalt, "groceries", "metro");
    const dining = getRewardRule(cobalt, "dining");
    assert.equal(grocery.capMonthly, 2500);
    assert.equal(dining.capMonthly, 2500);
    assert.equal(grocery.sharedCapGroup, "amex_cobalt_eats");
    assert.equal(dining.sharedCapGroup, "amex_cobalt_eats");
  });

  it("picks Cobalt over TD Aeroplan Infinite at Shell (2× MR vs 1.5× Aeroplan)", () => {
    const decision = route(
      [product("amex_cobalt"), product("td_aeroplan_infinite")],
      SHELL,
    );
    assert.equal(decision.selectedCardId, "amex_cobalt");
    assert.equal(decision.multiplier, 2);
  });

  it("picks Cobalt over CIBC Dividend Platinum at Shell (4% MR vs 3% cash)", () => {
    const decision = route(
      [product("amex_cobalt"), product("cibc_dividend_platinum")],
      SHELL,
    );
    assert.equal(decision.selectedCardId, "amex_cobalt");
  });

  it("picks Cobalt over TD Aeroplan Infinite on Uber rides", () => {
    const decision = route(
      [product("amex_cobalt"), product("td_aeroplan_infinite")],
      UBER,
    );
    assert.equal(decision.selectedCardId, "amex_cobalt");
    assert.equal(decision.multiplier, 2);
  });

  it("drops to 1× dining once grocery spend has filled the combined eats cap", () => {
    const cobalt = product("amex_cobalt");
    const decision = route(
      [cobalt, product("cibc_costco")],
      {
        amount: 80,
        merchantName: "Tim Hortons",
        mcc: "5814",
        merchantId: "tim_hortons",
        category: "dining",
      },
      [
        {
          cardId: "amex_cobalt",
          category: "groceries",
          spendThisPeriod: 2500,
          sharedCapGroup: "amex_cobalt_eats",
        },
      ],
    );
    assert.equal(decision.selectedCardId, "cibc_costco");
    const cobaltAlt = decision.alternatives.find((row) => row.cardId === "amex_cobalt");
    assert.equal(cobaltAlt?.cappedOut, true);
    assert.equal(cobaltAlt?.multiplier, 1);
  });

  it("still earns 5× groceries when the combined cap has room", () => {
    const decision = route([product("amex_cobalt"), product("cibc_dividend_platinum")], METRO);
    assert.equal(decision.selectedCardId, "amex_cobalt");
    assert.equal(decision.multiplier, 5);
  });
});
