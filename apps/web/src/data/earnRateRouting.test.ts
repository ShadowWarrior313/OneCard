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

describe("BMO eclipse rise is 2.5x groceries/dining/bills, not 3x dining / 1x else", () => {
  it("does not let Costco MC 1% beat eclipse rise at Metro", () => {
    const decision = route("metro", 80, ["bmo_eclipse_rise", "cibc_costco"]);
    assert.equal(decision.selectedCardId, "bmo_eclipse_rise");
    const rise = decision.alternatives.find((alt) => alt.cardId === "bmo_eclipse_rise");
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(rise?.multiplier, 2.5);
    assert.equal(costco?.multiplier, 1);
    assert.ok(
      (rise?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Avion 1x beat eclipse rise at Metro", () => {
    const decision = route("metro", 80, [
      "bmo_eclipse_rise",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "bmo_eclipse_rise");
    const rise = decision.alternatives.find((alt) => alt.cardId === "bmo_eclipse_rise");
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(rise?.multiplier, 2.5);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (rise?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Costco MC 1% beat eclipse rise on Rogers bills", () => {
    const decision = route("rogers", 80, ["bmo_eclipse_rise", "cibc_costco"]);
    assert.equal(decision.selectedCardId, "bmo_eclipse_rise");
    const rise = decision.alternatives.find((alt) => alt.cardId === "bmo_eclipse_rise");
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(rise?.multiplier, 2.5);
    assert.equal(costco?.multiplier, 1);
    assert.ok(
      (rise?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("awards 2.5x groceries, dining, and bills until the shared $5,000 envelope", () => {
    const card = mustCard("bmo_eclipse_rise");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2.5);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 2.5);
    assert.equal(getRewardRule(card, "recurring_bills", "rogers").multiplier, 2.5);
    assert.equal(getRewardRule(card, "groceries", "metro").capAnnual, 5000);
    assert.equal(
      getRewardRule(card, "groceries", "metro").sharedCapGroup,
      "bmo_eclipse_rise_bonus",
    );
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 0.5);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 0.5);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 0.5);
  });
});
