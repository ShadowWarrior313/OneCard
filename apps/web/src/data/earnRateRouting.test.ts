import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RoutingDecision } from "@onecard/shared-types";
import { getCardById } from "./cards";
import { merchantById } from "./merchants";

function mustCard(id: string): CardProduct {
  const card = getCardById(id);
  assert.ok(card, `missing catalog card ${id}`);
  return card;
}

function route(merchantId: string, amount: number, cardIds: string[]): RoutingDecision {
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
      usage: [],
      preferences: { preferCashback: false },
      defaultCardId: cardIds[0],
    },
  });
}

describe("Neo Mastercard base earn", () => {
  it("does not pay a flat 1% that beats a real 0.5% card at Amazon", () => {
    const decision = route("amazon", 80, ["neo_mastercard", "tangerine_money_back"]);
    assert.equal(decision.selectedCardId, "tangerine_money_back");
    const neo = decision.alternatives.find((alt) => alt.cardId === "neo_mastercard");
    const tangerine = decision.alternatives.find(
      (alt) => alt.cardId === "tangerine_money_back",
    );
    assert.ok(neo);
    assert.ok(tangerine);
    assert.equal(neo.multiplier, 0);
    assert.equal(neo.estimatedRewardValueCents, 0);
    assert.equal(tangerine.estimatedRewardValueCents, 40);
  });

  it("does not win a Costco tie against PC World Elite's 1% base", () => {
    const decision = route("costco", 80, ["neo_mastercard", "pc_world_elite_mc"]);
    assert.equal(decision.selectedCardId, "pc_world_elite_mc");
    const neo = decision.alternatives.find((alt) => alt.cardId === "neo_mastercard");
    const pc = decision.alternatives.find((alt) => alt.cardId === "pc_world_elite_mc");
    assert.ok(neo);
    assert.ok(pc);
    assert.equal(neo.estimatedRewardValueCents, 0);
    assert.equal(pc.estimatedRewardValueCents, 80);
  });
});
