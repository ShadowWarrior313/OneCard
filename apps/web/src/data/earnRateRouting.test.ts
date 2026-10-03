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

describe("Scotiabank Platinum American Express earns 2 Scene+ points on every purchase", () => {
  const wallet = ["scotia_platinum_amex", "rbc_avion_infinite"] as const;

  it("beats Avion on Metro, Shell, Amazon, and Walmart Grocery at 2%", () => {
    for (const merchantId of ["metro", "shell", "amazon", "walmart_grocery"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_platinum_amex");
      const platinum = decision.alternatives.find(
        (alt) => alt.cardId === "scotia_platinum_amex",
      );
      const avion = decision.alternatives.find(
        (alt) => alt.cardId === "rbc_avion_infinite",
      );
      assert.equal(platinum?.multiplier, 2);
      assert.equal(platinum?.estimatedRewardValueCents, 160);
      assert.ok(
        (platinum?.estimatedRewardValueCents ?? 0) >
          (avion?.estimatedRewardValueCents ?? 0),
      );
    }
  });

  it("beats Avion on Tim Hortons and direct Air Canada at the flat 2x rate", () => {
    for (const merchantId of ["tim_hortons", "air_canada"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_platinum_amex");
      const platinum = decision.alternatives.find(
        (alt) => alt.cardId === "scotia_platinum_amex",
      );
      assert.equal(platinum?.multiplier, 2);
      assert.equal(platinum?.estimatedRewardValueCents, 160);
    }
  });

  it("does not treat Scene+ Travel portal bonuses as a category travel rate", () => {
    for (const merchantId of ["marriott", "hilton", "expedia"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_platinum_amex");
      const platinum = decision.alternatives.find(
        (alt) => alt.cardId === "scotia_platinum_amex",
      );
      assert.equal(platinum?.multiplier, 2);
      assert.equal(platinum?.estimatedRewardValueCents, 160);
    }
  });

  it("is not offered at Loblaws or Save-On-Foods, where Amex is not accepted", () => {
    for (const merchantId of ["loblaws", "save_on_foods"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite");
      assert.equal(
        decision.alternatives.some((alt) => alt.cardId === "scotia_platinum_amex"),
        false,
      );
    }
  });

  it("uses the catalog Scene+ cent and a flat 2x rule", () => {
    const card = mustCard("scotia_platinum_amex");
    assert.equal(card.displayName, "Scotiabank Platinum American Express Card");
    assert.equal(card.annualFee, 399);
    assert.equal(card.currency, "Scene+ points");
    assert.equal(card.pointValueCents, 1);
    assert.equal(card.network, "amex");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "marriott").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "expedia").multiplier, 2);
  });
});
