import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, CategoryUsage, RoutingDecision } from "@onecard/shared-types";
import { getCardById } from "./cards";
import { merchantById } from "./merchants";

function mustCard(id: string): CardProduct {
  const card = getCardById(id);
  assert.ok(card, `missing catalog card ${id}`);
  return card;
}

function route(
  merchantId: string,
  amount: number,
  cardIds: string[],
  usage: CategoryUsage[] = [],
): RoutingDecision {
  const merchant = merchantById(merchantId);
  assert.ok(merchant, `missing merchant ${merchantId}`);
  return routeTransaction({
    mode: "network_dependent",
    transaction: {
      amount,
      merchantName: merchant.name,
      mcc: merchant.mcc,
      merchantId: merchant.id,
      category: merchant.category,
    },
    portfolio: {
      cards: cardIds.map(mustCard),
      usage,
      preferences: { preferCashback: false },
      defaultCardId: cardIds[0],
    },
  });
}

describe("Neo World Gas & Grocery rates", () => {
  const wallet = ["neo_world_mc", "td_cashback_infinite"] as const;

  it("does not send an $80 Metro trip to Neo World ahead of TD Cash Back Infinite", () => {
    const decision = route("metro", 80, [...wallet]);
    assert.equal(decision.selectedCardId, "td_cashback_infinite");
    const neo = decision.alternatives.find((alt) => alt.cardId === "neo_world_mc");
    const td = decision.alternatives.find((alt) => alt.cardId === "td_cashback_infinite");
    assert.ok(neo);
    assert.ok(td);
    assert.equal(neo.multiplier, 2);
    assert.equal(neo.estimatedRewardValueCents, 160);
    assert.equal(td.estimatedRewardValueCents, 240);
  });

  it("drops grocery earn to 0.5% after the $1,000 monthly cap", () => {
    const decision = route("metro", 80, [...wallet], [
      {
        cardId: "neo_world_mc",
        category: "groceries",
        spendThisPeriod: 1000,
      },
    ]);
    assert.equal(decision.selectedCardId, "td_cashback_infinite");
    const neo = decision.alternatives.find((alt) => alt.cardId === "neo_world_mc");
    assert.equal(neo?.multiplier, 0.5);
    assert.equal(neo?.estimatedRewardValueCents, 40);
    assert.equal(neo?.cappedOut, true);
  });

  it("keeps 2% on gas and recurring bills under their monthly caps", () => {
    const shell = route("shell", 80, ["neo_world_mc"]);
    assert.equal(shell.selectedCardId, "neo_world_mc");
    assert.equal(shell.multiplier, 2);
    assert.equal(shell.estimatedRewardValueCents, 160);

    const rogers = route("rogers", 80, ["neo_world_mc"]);
    assert.equal(rogers.multiplier, 2);
    assert.equal(rogers.estimatedRewardValueCents, 160);
  });

  it("earns 0.5% on everyday spend so a 1% card wins Amazon", () => {
    const decision = route("amazon", 80, ["neo_world_mc", "cibc_dividend"]);
    assert.equal(decision.selectedCardId, "cibc_dividend");
    const neo = decision.alternatives.find((alt) => alt.cardId === "neo_world_mc");
    assert.equal(neo?.multiplier, 0.5);
    assert.equal(neo?.estimatedRewardValueCents, 40);
  });
});
