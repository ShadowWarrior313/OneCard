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

describe("Marriott Bonvoy Business Amex is 5x at hotels, not a 1x stub", () => {
  it("beats Avion on a featured Marriott stay", () => {
    const decision = route("marriott", 80, [
      "amex_ca_marriott_business",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "amex_ca_marriott_business");
    const bonvoy = decision.alternatives.find(
      (alt) => alt.cardId === "amex_ca_marriott_business",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(bonvoy?.multiplier, 5);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (bonvoy?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0) + 100,
    );
  });

  it("beats Avion on featured Shell gas and Tim Hortons dining", () => {
    const shell = route("shell", 80, [
      "amex_ca_marriott_business",
      "rbc_avion_infinite",
    ]);
    assert.equal(shell.selectedCardId, "amex_ca_marriott_business");
    const shellBonvoy = shell.alternatives.find(
      (alt) => alt.cardId === "amex_ca_marriott_business",
    );
    assert.equal(shellBonvoy?.multiplier, 3);
    assert.ok(
      (shellBonvoy?.estimatedRewardValueCents ?? 0) >
        (shell.alternatives.find((alt) => alt.cardId === "rbc_avion_infinite")
          ?.estimatedRewardValueCents ?? 0) +
          100,
    );

    const tims = route("tim_hortons", 80, [
      "amex_ca_marriott_business",
      "rbc_avion_infinite",
    ]);
    assert.equal(tims.selectedCardId, "amex_ca_marriott_business");
    const timsBonvoy = tims.alternatives.find(
      (alt) => alt.cardId === "amex_ca_marriott_business",
    );
    assert.equal(timsBonvoy?.multiplier, 3);
    assert.ok(
      (timsBonvoy?.estimatedRewardValueCents ?? 0) >
        (tims.alternatives.find((alt) => alt.cardId === "rbc_avion_infinite")
          ?.estimatedRewardValueCents ?? 0),
    );
  });

  it("pays 3x on airlines and keeps other hotels at the 2x base", () => {
    const airCanada = route("air_canada", 80, [
      "amex_ca_marriott_business",
      "rbc_avion_infinite",
    ]);
    assert.equal(airCanada.selectedCardId, "amex_ca_marriott_business");
    const airBonvoy = airCanada.alternatives.find(
      (alt) => alt.cardId === "amex_ca_marriott_business",
    );
    assert.equal(airBonvoy?.multiplier, 3);

    for (const merchantId of ["hilton", "airbnb", "fairmont"] as const) {
      const decision = route(merchantId, 80, [
        "amex_ca_marriott_business",
        "rbc_avion_infinite",
      ]);
      const bonvoy = decision.alternatives.find(
        (alt) => alt.cardId === "amex_ca_marriott_business",
      );
      assert.equal(bonvoy?.multiplier, 2, merchantId);
    }
  });

  it("stores issuer fee, Bonvoy point value, and category rules", () => {
    const card = mustCard("amex_ca_marriott_business");
    assert.equal(card.displayName, "Marriott Bonvoy Business American Express Card");
    assert.equal(card.annualFee, 150);
    assert.equal(card.currency, "Bonvoy points");
    assert.equal(card.pointValueCents, 0.9);
    assert.equal(card.network, "amex");
    assert.equal(getRewardRule(card, "travel", "marriott").multiplier, 5);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 3);
    assert.equal(getRewardRule(card, "travel", "westjet").multiplier, 3);
    assert.equal(getRewardRule(card, "travel", "hilton").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "airbnb").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "fairmont").multiplier, 2);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 3);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 3);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
  });
});
