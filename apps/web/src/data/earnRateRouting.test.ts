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

describe("Desjardins Odyssey WE is 3% groceries / 3% dining, not 1x other", () => {
  it("does not let Avion 1x beat Odyssey WE on Metro groceries", () => {
    const decision = route("metro", 80, [
      "desjardins_odyssey_we",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "desjardins_odyssey_we");
    const odyssey = decision.alternatives.find(
      (alt) => alt.cardId === "desjardins_odyssey_we",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(odyssey?.multiplier, 3);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (odyssey?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Costco MC 1% beat Odyssey WE on Loblaws groceries", () => {
    const decision = route("loblaws", 80, [
      "desjardins_odyssey_we",
      "cibc_costco",
    ]);
    assert.equal(decision.selectedCardId, "desjardins_odyssey_we");
    const odyssey = decision.alternatives.find(
      (alt) => alt.cardId === "desjardins_odyssey_we",
    );
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(odyssey?.multiplier, 3);
    assert.equal(costco?.multiplier, 1);
    assert.ok(
      (odyssey?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Avion 1.25x dining beat Odyssey WE at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, [
      "desjardins_odyssey_we",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "desjardins_odyssey_we");
    const odyssey = decision.alternatives.find(
      (alt) => alt.cardId === "desjardins_odyssey_we",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(odyssey?.multiplier, 3);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (odyssey?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("awards 3x groceries with Costco excluded, 3x dining, 2x entertainment/transit/travel, 1x else", () => {
    const card = mustCard("desjardins_odyssey_we");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 3);
    assert.equal(getRewardRule(card, "groceries", "metro").capAnnual, 10000);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 3);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").capAnnual, 6000);
    assert.equal(getRewardRule(card, "entertainment").multiplier, 2);
    assert.equal(getRewardRule(card, "transportation").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "air_canada").capAnnual, 20000);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
  });
});
