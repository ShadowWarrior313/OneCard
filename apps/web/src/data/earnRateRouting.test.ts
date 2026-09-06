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

describe("BMO Ascend is 3x bills/entertainment, not 1x other", () => {
  it("does not let Costco MC 1% beat Ascend on Rogers bills", () => {
    const decision = route("rogers", 80, ["bmo_ascend", "cibc_costco"]);
    assert.equal(decision.selectedCardId, "bmo_ascend");
    const ascend = decision.alternatives.find((alt) => alt.cardId === "bmo_ascend");
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(ascend?.multiplier, 3);
    assert.equal(costco?.multiplier, 1);
    assert.ok(
      (ascend?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Avion 1x beat Ascend on Rogers bills", () => {
    const decision = route("rogers", 80, ["bmo_ascend", "rbc_avion_infinite"]);
    assert.equal(decision.selectedCardId, "bmo_ascend");
    const ascend = decision.alternatives.find((alt) => alt.cardId === "bmo_ascend");
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(ascend?.multiplier, 3);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (ascend?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Costco MC 1% beat Ascend on Enbridge bills", () => {
    const decision = route("enbridge", 80, ["bmo_ascend", "cibc_costco"]);
    assert.equal(decision.selectedCardId, "bmo_ascend");
    const ascend = decision.alternatives.find((alt) => alt.cardId === "bmo_ascend");
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(ascend?.multiplier, 3);
    assert.equal(costco?.multiplier, 1);
    assert.ok(
      (ascend?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("awards 5x travel and 3x dining/entertainment/bills until each annual cap", () => {
    const card = mustCard("bmo_ascend");
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 5);
    assert.equal(getRewardRule(card, "travel", "air_canada").capAnnual, 15000);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 3);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").capAnnual, 10000);
    assert.equal(getRewardRule(card, "entertainment").multiplier, 3);
    assert.equal(getRewardRule(card, "entertainment").capAnnual, 10000);
    assert.equal(getRewardRule(card, "recurring_bills", "rogers").multiplier, 3);
    assert.equal(getRewardRule(card, "recurring_bills", "rogers").capAnnual, 10000);
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 1);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
  });
});
