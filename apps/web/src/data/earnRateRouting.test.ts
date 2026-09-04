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

describe("National Bank Platinum is not 2x all travel or 1.5x other", () => {
  it("does not let NBC 2x travel beat SimplyCash 1.5% at Air Canada", () => {
    const decision = route("air_canada", 1000, [
      "nbc_platinum",
      "amex_simplycash_preferred",
    ]);
    assert.equal(decision.selectedCardId, "amex_simplycash_preferred");
    const nbc = decision.alternatives.find((alt) => alt.cardId === "nbc_platinum");
    const simply = decision.alternatives.find(
      (alt) => alt.cardId === "amex_simplycash_preferred",
    );
    assert.equal(nbc?.multiplier, 0.67);
    assert.equal(simply?.multiplier, 1.5);
    assert.ok(
      (simply?.estimatedRewardValueCents ?? 0) >
        (nbc?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let NBC 1.5x other beat Dividend Platinum 1% at Amazon", () => {
    const decision = route("amazon", 143, [
      "nbc_platinum",
      "cibc_dividend_platinum",
    ]);
    assert.equal(decision.selectedCardId, "cibc_dividend_platinum");
    const nbc = decision.alternatives.find((alt) => alt.cardId === "nbc_platinum");
    const platinum = decision.alternatives.find(
      (alt) => alt.cardId === "cibc_dividend_platinum",
    );
    assert.equal(nbc?.multiplier, 0.67);
    assert.equal(platinum?.multiplier, 1);
    assert.ok(
      (platinum?.estimatedRewardValueCents ?? 0) >
        (nbc?.estimatedRewardValueCents ?? 0),
    );
  });

  it("awards 2x groceries and dining until the shared $1,000 envelope", () => {
    const card = mustCard("nbc_platinum");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "metro").capMonthly, 1000);
    assert.equal(
      getRewardRule(card, "groceries", "metro").sharedCapGroup,
      "nbc_plat_eats",
    );
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 0.67);
    assert.equal(
      getRewardRule(card, "groceries", "walmart_grocery").multiplier,
      0.67,
    );
  });

  it("awards 1.5x gas and bills, 0.67x generic travel, and is Mastercard", () => {
    const card = mustCard("nbc_platinum");
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1.5);
    assert.equal(getRewardRule(card, "recurring_bills", "rogers").multiplier, 1.5);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 0.67);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 0.67);
    assert.equal(card.network, "mastercard");
  });

  it("is accepted at Costco warehouse as Mastercard", () => {
    const decision = route("costco", 80, ["nbc_platinum"]);
    assert.equal(decision.selectedCardId, "nbc_platinum");
  });
});
