import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, CategoryUsage, RoutingDecision } from "@onecard/shared-types";
import { getCardById } from "./cards";
import { merchantById } from "./merchants";

const CARD_ID = "cibc_aeroplan";
const CAP_GROUP = "cibc_aeroplan_bonus";

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

describe("CIBC Aeroplan Visa is not a 1x stub", () => {
  it("beats Avion on featured grocery, gas, and Air Canada purchases", () => {
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    for (const merchantId of ["metro", "shell", "walmart_grocery"] as const) {
      const decision = route(merchantId, 80, wallet);
      assert.equal(decision.selectedCardId, CARD_ID, merchantId);
      assert.equal(alt(decision, CARD_ID)?.multiplier, 1, merchantId);
      // 1 Aeroplan point × 2¢ = 2% ($1.60) vs Avion 1.4% ($1.12)
      assert.equal(alt(decision, CARD_ID)?.estimatedRewardValueCents, 160, merchantId);
      assert.ok(
        (alt(decision, CARD_ID)?.estimatedRewardValueCents ?? 0) >
          (alt(decision, "rbc_avion_infinite")?.estimatedRewardValueCents ?? 0) + 40,
        merchantId,
      );
    }

    const airCanada = route("air_canada", 80, wallet);
    assert.equal(airCanada.selectedCardId, CARD_ID);
    assert.equal(alt(airCanada, CARD_ID)?.multiplier, 1);
    assert.equal(alt(airCanada, CARD_ID)?.estimatedRewardValueCents, 160);
    assert.equal(alt(airCanada, "rbc_avion_infinite")?.estimatedRewardValueCents, 140);
  });

  it("keeps dining, shopping, and other travel on the 1-point-per-$1.50 base", () => {
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    for (const merchantId of ["tim_hortons", "amazon", "westjet", "marriott", "expedia"] as const) {
      const decision = route(merchantId, 80, wallet);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      assert.equal(alt(decision, CARD_ID)?.multiplier, 0.67, merchantId);
    }
  });

  it("keeps warehouse clubs off the grocery bonus", () => {
    const card = mustCard(CARD_ID);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 0.67);
    assert.equal(getRewardRule(card, "other", "costco_wholesale").multiplier, 0.67);
    assert.equal(getRewardRule(card, "groceries", "loblaws").multiplier, 1);
  });

  it("drops grocery, gas, and Air Canada to the base rate after the shared $40,000 cap", () => {
    const capped: CategoryUsage[] = [
      {
        cardId: CARD_ID,
        category: "other",
        spendThisPeriod: 40_000,
        sharedCapGroup: CAP_GROUP,
      },
    ];
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    for (const merchantId of ["metro", "shell", "air_canada"] as const) {
      const decision = route(merchantId, 80, wallet, capped);
      assert.equal(alt(decision, CARD_ID)?.multiplier, 0.67, merchantId);
      assert.equal(alt(decision, CARD_ID)?.cappedOut, true, merchantId);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
    }
  });

  it("stores the issuer fee, Aeroplan point value, and earn rules", () => {
    const card = mustCard(CARD_ID);
    assert.equal(card.displayName, "CIBC Aeroplan Visa Card");
    assert.equal(card.annualFee, 0);
    assert.equal(card.network, "visa");
    assert.equal(card.currency, "Aeroplan points");
    assert.equal(card.pointValueCents, 2);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 0.67);
  });
});
