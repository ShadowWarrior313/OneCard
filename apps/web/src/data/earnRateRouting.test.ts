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

describe("National Bank World Elite is 5x groceries and dining, not 2x", () => {
  it("does not let Costco MC 3% dining beat NBC 5x at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, ["nbc_world_elite", "cibc_costco"]);
    assert.equal(decision.selectedCardId, "nbc_world_elite");
    const nbc = decision.alternatives.find((alt) => alt.cardId === "nbc_world_elite");
    assert.equal(nbc?.multiplier, 5);
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(costco?.multiplier, 3);
    assert.ok(
      (nbc?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Momentum 4% groceries beat NBC 5x at Metro", () => {
    const decision = route("metro", 80, ["nbc_world_elite", "scotia_momentum"]);
    assert.equal(decision.selectedCardId, "nbc_world_elite");
    const nbc = decision.alternatives.find((alt) => alt.cardId === "nbc_world_elite");
    assert.equal(nbc?.multiplier, 5);
    const momentum = decision.alternatives.find(
      (alt) => alt.cardId === "scotia_momentum",
    );
    assert.equal(momentum?.multiplier, 4);
  });

  it("does not apply grocery 5x at warehouse clubs", () => {
    const card = mustCard("nbc_world_elite");
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 1);
  });

  it("awards 2x gas and bills, 1x generic travel and other", () => {
    const card = mustCard("nbc_world_elite");
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(card, "recurring_bills").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
    assert.equal(card.network, "mastercard");
  });
});
