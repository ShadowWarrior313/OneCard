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

describe("RBC Cash Back Preferred World Elite earns 3% on everyday categories", () => {
  const wallet = ["rbc_cashback_preferred", "rbc_avion_infinite"] as const;

  it("beats Avion on Tim Hortons dining at 3%", () => {
    const decision = route("tim_hortons", 80, [...wallet]);
    assert.equal(decision.selectedCardId, "rbc_cashback_preferred");
    const preferred = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_cashback_preferred",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(preferred?.multiplier, 3);
    assert.equal(preferred?.estimatedRewardValueCents, 240);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (preferred?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("beats Avion on Netflix streaming and Shell gas at 3%", () => {
    const netflix = route("netflix", 80, [...wallet]);
    assert.equal(netflix.selectedCardId, "rbc_cashback_preferred");
    assert.equal(
      netflix.alternatives.find((alt) => alt.cardId === "rbc_cashback_preferred")
        ?.multiplier,
      3,
    );

    const shell = route("shell", 80, [...wallet]);
    assert.equal(shell.selectedCardId, "rbc_cashback_preferred");
    assert.equal(
      shell.alternatives.find((alt) => alt.cardId === "rbc_cashback_preferred")
        ?.estimatedRewardValueCents,
      240,
    );
  });

  it("beats Avion on Uber rideshare and Steam because those merchants are coded other", () => {
    const uber = route("uber", 80, [...wallet]);
    assert.equal(uber.selectedCardId, "rbc_cashback_preferred");
    assert.equal(
      uber.alternatives.find((alt) => alt.cardId === "rbc_cashback_preferred")
        ?.multiplier,
      3,
    );

    const steam = route("steam", 80, [...wallet]);
    assert.equal(steam.selectedCardId, "rbc_cashback_preferred");
    assert.equal(
      steam.alternatives.find((alt) => alt.cardId === "rbc_cashback_preferred")
        ?.estimatedRewardValueCents,
      240,
    );
  });

  it("keeps Walmart and Costco at 1% so Avion wins grocery there", () => {
    const walmart = route("walmart_grocery", 80, [...wallet]);
    assert.equal(walmart.selectedCardId, "rbc_avion_infinite");
    assert.equal(
      walmart.alternatives.find((alt) => alt.cardId === "rbc_cashback_preferred")
        ?.multiplier,
      1,
    );

    const costco = route("costco", 80, [...wallet]);
    assert.equal(costco.selectedCardId, "rbc_cashback_preferred");
    const atCostco = costco.alternatives.find(
      (alt) => alt.cardId === "rbc_cashback_preferred",
    );
    assert.equal(atCostco?.multiplier, 1);
    assert.equal(atCostco?.estimatedRewardValueCents, 80);
    assert.equal(
      costco.alternatives.some((alt) => alt.cardId === "rbc_avion_infinite"),
      false,
    );
  });

  it("keeps the 1% base under Avion and earns 3% at real grocery stores", () => {
    const amazon = route("amazon", 80, [...wallet]);
    assert.equal(amazon.selectedCardId, "rbc_avion_infinite");

    const card = mustCard("rbc_cashback_preferred");
    assert.equal(card.displayName, "RBC Cash Back Preferred World Elite Mastercard");
    assert.equal(card.annualFee, 120);
    assert.equal(card.currency, "cashback %");
    assert.equal(card.pointValueCents, 1);
    assert.equal(card.network, "mastercard");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 3);
    assert.equal(getRewardRule(card, "groceries", "loblaws").multiplier, 3);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 1);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
    assert.equal(getRewardRule(card, "dining", "uber_eats").multiplier, 3);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 3);
    assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 3);
    assert.equal(getRewardRule(card, "other", "uber").multiplier, 3);
    assert.equal(getRewardRule(card, "other", "steam").multiplier, 3);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "via_rail").multiplier, 1);
  });
});

describe("no-fee RBC Cash Back Mastercard is 2% grocery, not a 1% stub", () => {
  const wallet = ["rbc_cashback_mastercard", "rbc_avion_infinite"] as const;

  it("beats Avion 1.4% on featured Metro and Loblaws groceries at 2%", () => {
    for (const merchantId of ["metro", "loblaws", "sobeys"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "rbc_cashback_mastercard");
      const cashback = decision.alternatives.find(
        (alt) => alt.cardId === "rbc_cashback_mastercard",
      );
      const avion = decision.alternatives.find(
        (alt) => alt.cardId === "rbc_avion_infinite",
      );
      assert.equal(cashback?.multiplier, 2);
      assert.equal(cashback?.estimatedRewardValueCents, 160);
      assert.ok(
        (cashback?.estimatedRewardValueCents ?? 0) >
          (avion?.estimatedRewardValueCents ?? 0),
      );
    }
  });

  it("does not apply grocery 2% at Walmart or Costco", () => {
    const walmart = route("walmart_grocery", 80, [...wallet]);
    assert.equal(walmart.selectedCardId, "rbc_avion_infinite");
    assert.equal(
      walmart.alternatives.find((alt) => alt.cardId === "rbc_cashback_mastercard")
        ?.multiplier,
      0.5,
    );

    const costco = route("costco", 80, [...wallet]);
    assert.equal(costco.selectedCardId, "rbc_cashback_mastercard");
    assert.equal(
      costco.alternatives.find((alt) => alt.cardId === "rbc_cashback_mastercard")
        ?.multiplier,
      0.5,
    );
    assert.equal(
      costco.alternatives.some((alt) => alt.cardId === "rbc_avion_infinite"),
      false,
    );
  });

  it("stays under Avion on gas, dining, and everything else", () => {
    const shell = route("shell", 80, [...wallet]);
    assert.equal(shell.selectedCardId, "rbc_avion_infinite");
    assert.equal(
      shell.alternatives.find((alt) => alt.cardId === "rbc_cashback_mastercard")
        ?.multiplier,
      1,
    );

    const tims = route("tim_hortons", 80, [...wallet]);
    assert.equal(tims.selectedCardId, "rbc_avion_infinite");
    assert.equal(
      tims.alternatives.find((alt) => alt.cardId === "rbc_cashback_mastercard")
        ?.multiplier,
      0.5,
    );

    const uber = route("uber", 80, [...wallet]);
    assert.equal(uber.selectedCardId, "rbc_avion_infinite");
    assert.equal(
      uber.alternatives.find((alt) => alt.cardId === "rbc_cashback_mastercard")
        ?.multiplier,
      1,
    );

    const card = mustCard("rbc_cashback_mastercard");
    assert.equal(card.displayName, "RBC Cash Back Mastercard");
    assert.equal(card.annualFee, 0);
    assert.equal(card.currency, "cashback %");
    assert.equal(card.pointValueCents, 1);
    assert.equal(card.network, "mastercard");
    assert.equal(getRewardRule(card, "groceries", "superstore").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 0.5);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 0.5);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "uber").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 0.5);
    assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 0.5);
  });
});
