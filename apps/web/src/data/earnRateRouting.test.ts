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

describe("catalog earn rates that previously inverted winners", () => {
  it("gives Scotia Gold 6× at Sobeys banners and 5× at other grocers", () => {
    const gold = product("scotia_gold_amex");
    const partnerRule = gold.rewards.find(
      (rule) => rule.category === "groceries" && rule.merchantIds?.length,
    );
    assert.deepEqual(partnerRule?.merchantIds, [...SCENE_GROCERY_MERCHANTS]);
    assert.equal(partnerRule?.multiplier, 6);
    assert.equal(getRewardRule(gold, "groceries", "sobeys").multiplier, 6);
    assert.equal(getRewardRule(gold, "groceries", "metro").multiplier, 5);
    assert.equal(getRewardRule(gold, "entertainment").multiplier, 5);
    assert.equal(getRewardRule(gold, "transportation").multiplier, 3);
  });

  it("picks Scotia Gold over Momentum at Sobeys (6% Scene+ vs 4% cashback)", () => {
    const decision = route(
      [product("scotia_gold_amex"), product("scotia_momentum")],
      {
        amount: 100,
        merchantName: "Sobeys",
        mcc: "5411",
        merchantId: "sobeys",
        category: "groceries",
      },
    );
    assert.equal(decision.selectedCardId, "scotia_gold_amex");
    assert.equal(decision.multiplier, 6);
  });

  it("maps BMO CashBack WE to 3% gas and 4% transit, not 4% gas", () => {
    const bmo = product("bmo_cashback_we");
    assert.equal(getRewardRule(bmo, "gas").multiplier, 3);
    assert.equal(getRewardRule(bmo, "gas").capMonthly, 300);
    assert.equal(getRewardRule(bmo, "transportation").multiplier, 4);
    assert.equal(getRewardRule(bmo, "transportation").capMonthly, 300);
  });

  it("picks CIBC Dividend Infinite over BMO WE at Shell (4% gas vs 3%)", () => {
    const decision = route(
      [product("bmo_cashback_we"), product("cibc_dividend_infinite")],
      {
        amount: 80,
        merchantName: "Shell",
        mcc: "5541",
        merchantId: "shell",
        category: "gas",
      },
    );
    assert.equal(decision.selectedCardId, "cibc_dividend_infinite");
    assert.equal(decision.multiplier, 4);
  });

  it("picks BMO WE over Cobalt on Uber rides (4% transit vs 1× MR)", () => {
    const decision = route(
      [product("bmo_cashback_we"), product("amex_cobalt")],
      {
        amount: 50,
        merchantName: "Uber",
        mcc: "4121",
        merchantId: "uber",
        category: "transportation",
      },
    );
    assert.equal(decision.selectedCardId, "bmo_cashback_we");
    assert.equal(decision.multiplier, 4);
  });

  it("limits TD First Class 8× travel to Expedia For TD, not airlines", () => {
    const td = product("td_first_class");
    assert.equal(getRewardRule(td, "travel", "expedia").multiplier, 8);
    assert.equal(getRewardRule(td, "travel", "air_canada").multiplier, 2);
    assert.equal(getRewardRule(td, "dining").multiplier, 6);
    assert.equal(getRewardRule(td, "groceries").multiplier, 6);
  });

  it("picks Avion over TD First Class on a direct Air Canada booking", () => {
    const decision = route(
      [product("td_first_class"), product("rbc_avion_infinite")],
      {
        amount: 1000,
        merchantName: "Air Canada",
        mcc: "3000",
        merchantId: "air_canada",
        category: "travel",
      },
    );
    assert.equal(decision.selectedCardId, "rbc_avion_infinite");
    assert.equal(getRewardRule(product("td_first_class"), "travel", "air_canada").multiplier, 2);
  });

  it("picks TD First Class over Avion on Expedia For TD", () => {
    const decision = route(
      [product("td_first_class"), product("rbc_avion_infinite")],
      {
        amount: 1000,
        merchantName: "Expedia",
        mcc: "4722",
        merchantId: "expedia",
        category: "travel",
      },
    );
    assert.equal(decision.selectedCardId, "td_first_class");
    assert.equal(decision.multiplier, 8);
  });
});
