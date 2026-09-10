import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RoutingDecision } from "@onecard/shared-types";
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
      usage: [],
      preferences: { preferCashback: false },
      defaultCardId: cardIds[0],
    },
  });
}

describe("Triangle World Elite is 3% groceries / 4% Canadian Tire, not 1x other", () => {
  it("does not let Avion 1x beat Triangle World Elite on Metro groceries", () => {
    const decision = route("metro", 80, [
      "triangle_world_elite",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "triangle_world_elite");
    const triangle = decision.alternatives.find(
      (alt) => alt.cardId === "triangle_world_elite",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(triangle?.multiplier, 3);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (triangle?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Costco MC 1% beat Triangle World Elite on Loblaws groceries", () => {
    const decision = route("loblaws", 80, [
      "triangle_world_elite",
      "cibc_costco",
    ]);
    assert.equal(decision.selectedCardId, "triangle_world_elite");
    const triangle = decision.alternatives.find(
      (alt) => alt.cardId === "triangle_world_elite",
    );
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(triangle?.multiplier, 3);
    assert.equal(costco?.multiplier, 1);
    assert.ok(
      (triangle?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Costco MC 1% beat Triangle World Elite at Canadian Tire", () => {
    const decision = route("canadian_tire", 80, [
      "triangle_world_elite",
      "cibc_costco",
    ]);
    assert.equal(decision.selectedCardId, "triangle_world_elite");
    const triangle = decision.alternatives.find(
      (alt) => alt.cardId === "triangle_world_elite",
    );
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(triangle?.multiplier, 4);
    assert.equal(costco?.multiplier, 1);
    assert.ok(
      (triangle?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("awards 3x groceries with Costco/Walmart excluded, 4x at Canadian Tire, 1x else", () => {
    const card = mustCard("triangle_world_elite");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 3);
    assert.equal(getRewardRule(card, "groceries", "metro").capAnnual, 12000);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "canadian_tire").multiplier, 4);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
  });
});
