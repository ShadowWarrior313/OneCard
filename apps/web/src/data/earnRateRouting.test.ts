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

describe("Amex Gold dining is 1x, not 2x", () => {
  it("does not let Gold 2x dining beat Costco MC 3% at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, ["amex_gold", "cibc_costco"]);
    assert.equal(decision.selectedCardId, "cibc_costco");
    const gold = decision.alternatives.find((alt) => alt.cardId === "amex_gold");
    assert.equal(gold?.multiplier, 1);
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(costco?.multiplier, 3);
  });

  it("still awards Gold 2x at Metro groceries, Shell, and Air Canada", () => {
    const gold = mustCard("amex_gold");
    assert.equal(getRewardRule(gold, "groceries", "metro").multiplier, 2);
    assert.equal(getRewardRule(gold, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(gold, "travel", "air_canada").multiplier, 2);
  });

  it("does not let Gold 2x groceries beat Momentum at Walmart Grocery", () => {
    const decision = route("walmart_grocery", 80, ["amex_gold", "scotia_momentum"]);
    assert.equal(decision.selectedCardId, "scotia_momentum");
    const gold = decision.alternatives.find((alt) => alt.cardId === "amex_gold");
    assert.equal(gold?.multiplier, 1);
  });
});

describe("Marriott Bonvoy Amex personal card is 2x away from hotels", () => {
  it("does not let Marriott 3x dining beat Dividend Platinum 2% at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, [
      "amex_marriott",
      "cibc_dividend_platinum",
    ]);
    assert.equal(decision.selectedCardId, "cibc_dividend_platinum");
    const marriott = decision.alternatives.find(
      (alt) => alt.cardId === "amex_marriott",
    );
    assert.equal(marriott?.multiplier, 2);
    const platinum = decision.alternatives.find(
      (alt) => alt.cardId === "cibc_dividend_platinum",
    );
    assert.equal(platinum?.multiplier, 2);
    assert.ok(
      (platinum?.estimatedRewardValueCents ?? 0) >
        (marriott?.estimatedRewardValueCents ?? 0),
    );
  });

  it("still awards 5x at Marriott hotels and 2x on other spend", () => {
    const card = mustCard("amex_marriott");
    assert.equal(getRewardRule(card, "travel", "marriott").multiplier, 5);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 2);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 2);
  });
});
