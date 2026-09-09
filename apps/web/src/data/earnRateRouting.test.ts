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

describe("Desjardins Odyssey Privilege is 3% groceries / 4% dining, not 1x other", () => {
  it("does not let Avion 1x beat Odyssey Privilege on Metro groceries", () => {
    const decision = route("metro", 80, [
      "desjardins_odyssey_privilege",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "desjardins_odyssey_privilege");
    const privilege = decision.alternatives.find(
      (alt) => alt.cardId === "desjardins_odyssey_privilege",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(privilege?.multiplier, 3);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (privilege?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Costco MC 1% beat Odyssey Privilege on Loblaws groceries", () => {
    const decision = route("loblaws", 80, [
      "desjardins_odyssey_privilege",
      "cibc_costco",
    ]);
    assert.equal(decision.selectedCardId, "desjardins_odyssey_privilege");
    const privilege = decision.alternatives.find(
      (alt) => alt.cardId === "desjardins_odyssey_privilege",
    );
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(privilege?.multiplier, 3);
    assert.equal(costco?.multiplier, 1);
    assert.ok(
      (privilege?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Avion 1.25x dining beat Odyssey Privilege at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, [
      "desjardins_odyssey_privilege",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "desjardins_odyssey_privilege");
    const privilege = decision.alternatives.find(
      (alt) => alt.cardId === "desjardins_odyssey_privilege",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(privilege?.multiplier, 4);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (privilege?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Avion 1.25x travel beat Odyssey Privilege on Air Canada", () => {
    const decision = route("air_canada", 1000, [
      "desjardins_odyssey_privilege",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "desjardins_odyssey_privilege");
    const privilege = decision.alternatives.find(
      (alt) => alt.cardId === "desjardins_odyssey_privilege",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(privilege?.multiplier, 3);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (privilege?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("awards 3x groceries with Costco excluded, 4x dining/entertainment/transit, 3x travel, 1.5x else", () => {
    const card = mustCard("desjardins_odyssey_privilege");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 3);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1.5);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 4);
    assert.equal(getRewardRule(card, "entertainment").multiplier, 4);
    assert.equal(getRewardRule(card, "transportation").multiplier, 4);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 3);
    assert.equal(getRewardRule(card, "travel", "air_canada").capAnnual, 25000);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1.5);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1.5);
  });
});
