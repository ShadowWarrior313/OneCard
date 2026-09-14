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

describe("Amex Aeroplan Card is 2x Air Canada / 1.5x dining / 1x else, not a 1x stub", () => {
  it("beats Avion 1.75% on featured Air Canada travel at 2x / 2¢", () => {
    const decision = route("air_canada", 1000, [
      "amex_ca_aeroplan",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_aeroplan");
    const aeroplan = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_aeroplan",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(aeroplan?.multiplier, 2);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (aeroplan?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("beats Avion 1.75% dining at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, [
      "amex_ca_aeroplan",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_aeroplan");
    const aeroplan = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_aeroplan",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(aeroplan?.multiplier, 1.5);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (aeroplan?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("beats Avion 1.4% on featured Amazon shopping at 1x / 2¢", () => {
    const decision = route("amazon", 143, [
      "amex_ca_aeroplan",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_aeroplan");
    const aeroplan = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_aeroplan",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(aeroplan?.multiplier, 1);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (aeroplan?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not apply the Air Canada 2x to generic travel or groceries", () => {
    const card = mustCard("amex_ca_aeroplan");
    assert.equal(card.displayName, "American Express Aeroplan Card");
    assert.equal(card.annualFee, 120);
    assert.equal(card.currency, "Aeroplan points");
    assert.equal(card.pointValueCents, 2);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "westjet").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "expedia").multiplier, 1);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1.5);
    assert.equal(getRewardRule(card, "dining", "uber_eats").multiplier, 1.5);
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
  });
});
