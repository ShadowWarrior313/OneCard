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

describe("BMO eclipse Visa Infinite is 5x grocery/dining/gas/transit, not a 1x stub", () => {
  it("beats Avion 1.4% on Metro groceries at 5x / 0.67¢", () => {
    const decision = route("metro", 80, [
      "bmo_eclipse_infinite",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "bmo_eclipse_infinite");
    const eclipse = decision.alternatives.find(
      (alt) => alt.cardId === "bmo_eclipse_infinite",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(eclipse?.multiplier, 5);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (eclipse?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("beats Costco MC 3% dining at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, [
      "bmo_eclipse_infinite",
      "cibc_costco",
    ]);
    assert.equal(decision.selectedCardId, "bmo_eclipse_infinite");
    const eclipse = decision.alternatives.find(
      (alt) => alt.cardId === "bmo_eclipse_infinite",
    );
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(eclipse?.multiplier, 5);
    assert.equal(costco?.multiplier, 3);
    assert.ok(
      (eclipse?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("beats Dividend Platinum 3% on Shell gas", () => {
    const decision = route("shell", 80, [
      "bmo_eclipse_infinite",
      "cibc_dividend_platinum",
    ]);
    assert.equal(decision.selectedCardId, "bmo_eclipse_infinite");
    const eclipse = decision.alternatives.find(
      (alt) => alt.cardId === "bmo_eclipse_infinite",
    );
    const platinum = decision.alternatives.find(
      (alt) => alt.cardId === "cibc_dividend_platinum",
    );
    assert.equal(eclipse?.multiplier, 5);
    assert.equal(platinum?.multiplier, 3);
    assert.ok(
      (eclipse?.estimatedRewardValueCents ?? 0) >
        (platinum?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not treat Costco warehouse as grocery 5x", () => {
    const decision = route("costco", 80, [
      "bmo_eclipse_infinite",
      "cibc_costco",
    ]);
    assert.equal(decision.selectedCardId, "cibc_costco");
    const eclipse = decision.alternatives.find(
      (alt) => alt.cardId === "bmo_eclipse_infinite",
    );
    assert.equal(eclipse?.multiplier, 1);
  });

  it("awards 5x grocery/dining/gas/transit with annual caps at BMO Rewards cash value", () => {
    const card = mustCard("bmo_eclipse_infinite");
    assert.equal(card.displayName, "BMO eclipse Visa Infinite Card");
    assert.equal(card.annualFee, 120);
    assert.equal(card.currency, "BMO Rewards");
    assert.equal(card.pointValueCents, 0.67);
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 5);
    assert.equal(getRewardRule(card, "groceries", "metro").capAnnual, 6000);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 5);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").capAnnual, 6000);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 5);
    assert.equal(getRewardRule(card, "gas", "shell").capAnnual, 20000);
    assert.equal(getRewardRule(card, "transportation").multiplier, 5);
    assert.equal(getRewardRule(card, "transportation").capAnnual, 20000);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 5);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "expedia").multiplier, 1);
  });
});
