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

describe("Amex Aeroplan Reserve is 3x Air Canada / 2x dining / 1.25x else, not a 1x stub", () => {
  it("beats Avion 1.75% on featured Air Canada travel at 3x / 2¢", () => {
    const decision = route("air_canada", 1000, [
      "amex_ca_aeroplan_reserve",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_aeroplan_reserve");
    const reserve = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_aeroplan_reserve",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(reserve?.multiplier, 3);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (reserve?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("beats Costco MC 3% dining at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, [
      "amex_ca_aeroplan_reserve",
      "cibc_costco",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_aeroplan_reserve");
    const reserve = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_aeroplan_reserve",
    );
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(reserve?.multiplier, 2);
    assert.equal(costco?.multiplier, 3);
    assert.ok(
      (reserve?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("beats Avion 1.4% on featured Amazon shopping at 1.25x / 2¢", () => {
    const decision = route("amazon", 143, [
      "amex_ca_aeroplan_reserve",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_aeroplan_reserve");
    const reserve = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_aeroplan_reserve",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(reserve?.multiplier, 1.25);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (reserve?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not apply the Air Canada 3x to generic travel or groceries", () => {
    const card = mustCard("amex_ca_aeroplan_reserve");
    assert.equal(card.displayName, "American Express Aeroplan Reserve Card");
    assert.equal(card.annualFee, 599);
    assert.equal(card.currency, "Aeroplan points");
    assert.equal(card.pointValueCents, 2);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 3);
    assert.equal(getRewardRule(card, "travel", "westjet").multiplier, 1.25);
    assert.equal(getRewardRule(card, "travel", "expedia").multiplier, 1.25);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 2);
    assert.equal(getRewardRule(card, "dining", "uber_eats").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 1.25);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1.25);
  });
});
