import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, CategoryUsage, RoutingDecision } from "@onecard/shared-types";
import { getCardById } from "./cards";
import { merchantById } from "./merchants";

const CARD_ID = "cibc_aventura_privilege";
const CAP_GROUP = "cibc_aventura_privilege_bonus";

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

function alt(decision: RoutingDecision, cardId: string) {
  return decision.alternatives.find((entry) => entry.cardId === cardId);
}

describe("CIBC Aventura Visa Infinite Privilege is not a 1x stub", () => {
  it("beats Avion on featured grocery, gas, dining, cinema, and transit purchases", () => {
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    for (const merchantId of ["metro", "shell", "cineplex", "uber"] as const) {
      const decision = route(merchantId, 80, wallet);
      assert.equal(decision.selectedCardId, CARD_ID, merchantId);
      assert.equal(alt(decision, CARD_ID)?.multiplier, 2, merchantId);
      assert.ok(
        (alt(decision, CARD_ID)?.estimatedRewardValueCents ?? 0) >
          (alt(decision, "rbc_avion_infinite")?.estimatedRewardValueCents ?? 0) + 70,
        merchantId,
      );
    }

    const tims = route("tim_hortons", 80, wallet);
    assert.equal(tims.selectedCardId, CARD_ID);
    assert.equal(alt(tims, CARD_ID)?.multiplier, 2);
    assert.ok(
      (alt(tims, CARD_ID)?.estimatedRewardValueCents ?? 0) >
        (alt(tims, "rbc_avion_infinite")?.estimatedRewardValueCents ?? 0) + 40,
    );
  });

  it("keeps portal-only travel at the base rate and does not accelerate airlines or hotels", () => {
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    for (const merchantId of ["air_canada", "westjet", "marriott", "expedia"] as const) {
      const decision = route(merchantId, 80, wallet);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      assert.equal(alt(decision, CARD_ID)?.multiplier, 1.25, merchantId);
    }
  });

  it("keeps warehouse clubs, US transit, and non-theatre entertainment off the 2x bonus", () => {
    const card = mustCard(CARD_ID);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1.25);
    assert.equal(getRewardRule(card, "other", "costco_wholesale").multiplier, 1.25);
    assert.equal(getRewardRule(card, "other", "mta").multiplier, 1.25);
    assert.equal(getRewardRule(card, "other", "clipper").multiplier, 1.25);
    assert.equal(getRewardRule(card, "other", "steam").multiplier, 1.25);
    assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 1.25);
    assert.equal(getRewardRule(card, "travel", "via_rail").multiplier, 1.25);
  });

  it("drops grocery, dining, cinema, and transit to 1.25x after the shared $200,000 cap", () => {
    const capped: CategoryUsage[] = [
      {
        cardId: CARD_ID,
        category: "other",
        spendThisPeriod: 200_000,
        sharedCapGroup: CAP_GROUP,
      },
    ];
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    for (const merchantId of ["metro", "tim_hortons", "cineplex", "uber"] as const) {
      const decision = route(merchantId, 80, wallet, capped);
      assert.equal(alt(decision, CARD_ID)?.multiplier, 1.25, merchantId);
      assert.equal(alt(decision, CARD_ID)?.cappedOut, true, merchantId);
    }

    const tims = route("tim_hortons", 80, wallet, capped);
    assert.equal(tims.selectedCardId, "rbc_avion_infinite");

    const airCanada = route("air_canada", 80, [CARD_ID], capped);
    assert.equal(alt(airCanada, CARD_ID)?.multiplier, 1.25);
  });

  it("stores the issuer fee, Aventura point value, and earn rules", () => {
    const card = mustCard(CARD_ID);
    assert.equal(card.displayName, "CIBC Aventura Visa Infinite Privilege Card");
    assert.equal(card.annualFee, 499);
    assert.equal(card.currency, "Aventura points");
    assert.equal(card.pointValueCents, 1.2);
    assert.equal(card.network, "visa");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 2);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "cineplex").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "ticketmaster").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "uber").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "ttc").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1.25);
  });
});
