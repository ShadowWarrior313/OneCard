import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, CategoryUsage, RoutingDecision } from "@onecard/shared-types";
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
  usage: CategoryUsage[] = [],
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
      usage,
      preferences: { preferCashback: false },
      defaultCardId: cardIds[0],
    },
  });
}

describe("Scotia Momentum Visa earns 2% on grocery, gas, drugstore, transit, and bills", () => {
  const wallet = ["scotia_momentum_visa", "rbc_avion_infinite"] as const;

  it("beats Avion on Metro, Loblaws, Superstore, and Walmart Grocery", () => {
    for (const merchantId of ["metro", "loblaws", "superstore", "walmart_grocery"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_momentum_visa");
      const momentum = decision.alternatives.find(
        (alt) => alt.cardId === "scotia_momentum_visa",
      );
      const avion = decision.alternatives.find((alt) => alt.cardId === "rbc_avion_infinite");
      assert.equal(momentum?.multiplier, 2);
      assert.equal(momentum?.estimatedRewardValueCents, 160);
      assert.ok(
        (momentum?.estimatedRewardValueCents ?? 0) >
          (avion?.estimatedRewardValueCents ?? 0),
      );
    }
  });

  it("beats Avion on gas, drugstores, transit, and recurring bills", () => {
    for (const merchantId of [
      "shell",
      "shoppers",
      "rexall",
      "uber",
      "ttc",
      "via_rail",
      "bell",
    ]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_momentum_visa", merchantId);
      const momentum = decision.alternatives.find(
        (alt) => alt.cardId === "scotia_momentum_visa",
      );
      assert.equal(momentum?.multiplier, 2, merchantId);
      assert.equal(momentum?.estimatedRewardValueCents, 160, merchantId);
    }
  });

  it("does not treat dining, delivery, streaming, or general retail as the 2% rate", () => {
    for (const merchantId of ["tim_hortons", "uber_eats", "doordash", "netflix", "amazon", "walmart"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      const momentum = decision.alternatives.find(
        (alt) => alt.cardId === "scotia_momentum_visa",
      );
      assert.equal(momentum?.multiplier, 1, merchantId);
      assert.equal(momentum?.estimatedRewardValueCents, 80, merchantId);
    }
  });

  it("drops grocery and gas to 1% after the shared $25,000 annual bonus", () => {
    const usage: CategoryUsage[] = [
      {
        cardId: "scotia_momentum_visa",
        category: "groceries",
        spendThisPeriod: 25000,
        sharedCapGroup: "scotia_momentum_visa_bonus",
      },
    ];
    for (const merchantId of ["metro", "shell"]) {
      const decision = route(merchantId, 80, [...wallet], usage);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      const momentum = decision.alternatives.find(
        (alt) => alt.cardId === "scotia_momentum_visa",
      );
      assert.equal(momentum?.multiplier, 1, merchantId);
      assert.equal(momentum?.estimatedRewardValueCents, 80, merchantId);
    }
  });

  it("keeps Costco warehouse off the grocery bonus and does not copy the rate onto other Scotia cards", () => {
    const card = mustCard("scotia_momentum_visa");
    assert.equal(card.displayName, "Scotiabank Momentum Visa Card");
    assert.equal(card.annualFee, 49);
    assert.equal(card.currency, "cashback %");
    assert.equal(card.pointValueCents, 1);
    assert.equal(card.network, "visa");

    const grocery = getRewardRule(card, "groceries", "metro");
    assert.equal(grocery.multiplier, 2);
    assert.equal(grocery.capAnnual, 25000);
    assert.equal(grocery.sharedCapGroup, "scotia_momentum_visa_bonus");
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
    assert.equal(getRewardRule(card, "groceries", "costco_wholesale").multiplier, 1);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "shoppers").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "via_rail").multiplier, 2);
    assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 1);

    const student = mustCard("scotia_momentum_student");
    assert.equal(getRewardRule(student, "groceries", "metro").multiplier, 1);

    const noFee = mustCard("scotia_momentum_no_fee");
    const noFeeGrocery = getRewardRule(noFee, "groceries", "metro");
    assert.equal(noFeeGrocery.multiplier, 2);
    assert.equal(noFeeGrocery.capMonthly, 100);
    assert.equal(noFeeGrocery.capAnnual, undefined);
  });
});
