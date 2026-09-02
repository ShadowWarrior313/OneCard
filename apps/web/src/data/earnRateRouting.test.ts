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

describe("BMO eclipse VIP is 5x on groceries, dining, gas, drugstore, and travel", () => {
  it("does not let Costco MC 3% dining beat eclipse 5x at Tim Hortons", () => {
    const decision = route("tim_hortons", 80, ["bmo_eclipse", "cibc_costco"]);
    assert.equal(decision.selectedCardId, "bmo_eclipse");
    const eclipse = decision.alternatives.find((alt) => alt.cardId === "bmo_eclipse");
    assert.equal(eclipse?.multiplier, 5);
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(costco?.multiplier, 3);
    assert.ok(
      (eclipse?.estimatedRewardValueCents ?? 0) >
        (costco?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let Dividend Platinum 3% gas beat eclipse 5x at Shell", () => {
    const decision = route("shell", 80, ["bmo_eclipse", "cibc_dividend_platinum"]);
    assert.equal(decision.selectedCardId, "bmo_eclipse");
    const eclipse = decision.alternatives.find((alt) => alt.cardId === "bmo_eclipse");
    assert.equal(eclipse?.multiplier, 5);
    const platinum = decision.alternatives.find(
      (alt) => alt.cardId === "cibc_dividend_platinum",
    );
    assert.equal(platinum?.multiplier, 3);
  });

  it("does not let Dividend Infinite 2% groceries beat eclipse 5x at Metro", () => {
    const decision = route("metro", 80, ["bmo_eclipse", "cibc_dividend_infinite"]);
    assert.equal(decision.selectedCardId, "bmo_eclipse");
    const eclipse = decision.alternatives.find((alt) => alt.cardId === "bmo_eclipse");
    assert.equal(eclipse?.multiplier, 5);
    const infinite = decision.alternatives.find(
      (alt) => alt.cardId === "cibc_dividend_infinite",
    );
    assert.equal(infinite?.multiplier, 2);
  });

  it("still awards 5x travel and 1x base spend", () => {
    const card = mustCard("bmo_eclipse");
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 5);
    assert.equal(getRewardRule(card, "drugstore").multiplier, 5);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
  });
});
