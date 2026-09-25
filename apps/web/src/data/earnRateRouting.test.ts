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

describe("no-fee SimplyCash is 2% grocery/gas and 1.25% else, not a 1% stub", () => {
  it("beats Avion 1.4% on featured Metro groceries at 2%", () => {
    const decision = route("metro", 80, [
      "amex_ca_simplycash",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_simplycash");
    const simply = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_simplycash",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(simply?.multiplier, 2);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (simply?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("beats Avion 1.4% on featured Shell gas at 2%", () => {
    const decision = route("shell", 80, [
      "amex_ca_simplycash",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_simplycash");
    const simply = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_simplycash",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(simply?.multiplier, 2);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (simply?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not apply grocery 2% at Walmart or after the $15,000 grocery cap", () => {
    const walmart = route("walmart_grocery", 80, [
      "amex_ca_simplycash",
      "rbc_avion_infinite",
    ]);
    assert.equal(walmart.selectedCardId, "rbc_avion_infinite");
    const walmartSimply = walmart.alternatives.find(
      (alt) => alt.cardId === "amex_ca_simplycash",
    );
    assert.equal(walmartSimply?.multiplier, 1.25);

    const capped = route(
      "metro",
      80,
      ["amex_ca_simplycash", "rbc_avion_infinite"],
      [
        {
          cardId: "amex_ca_simplycash",
          category: "groceries",
          spendThisPeriod: 15000,
        },
      ],
    );
    assert.equal(capped.selectedCardId, "rbc_avion_infinite");
    const cappedSimply = capped.alternatives.find(
      (alt) => alt.cardId === "amex_ca_simplycash",
    );
    assert.equal(cappedSimply?.multiplier, 1.25);
  });

  it("keeps the 1.25% base under Avion on Amazon and excludes warehouse grocery", () => {
    const decision = route("amazon", 143, [
      "amex_ca_simplycash",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "rbc_avion_infinite");

    const card = mustCard("amex_ca_simplycash");
    assert.equal(card.displayName, "SimplyCash Card from American Express");
    assert.equal(card.annualFee, 0);
    assert.equal(card.currency, "cashback %");
    assert.equal(card.pointValueCents, 1);
    assert.equal(card.network, "amex");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "sobeys").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 1.25);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1.25);
    assert.equal(getRewardRule(card, "groceries", "superstore").multiplier, 1.25);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1.25);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1.25);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1.25);
  });
});
