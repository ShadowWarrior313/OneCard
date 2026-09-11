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

describe("BMO Blue Rewards WE is 2x grocery/gas at 0.67¢, not 3x AIR MILES at 1.2¢", () => {
  it("does not let overstated AIR MILES 3x beat Dividend Platinum 3% on Shell gas", () => {
    const decision = route("shell", 80, [
      "bmo_airmiles",
      "cibc_dividend_platinum",
    ]);
    assert.equal(decision.selectedCardId, "cibc_dividend_platinum");
    const blue = decision.alternatives.find((alt) => alt.cardId === "bmo_airmiles");
    const platinum = decision.alternatives.find(
      (alt) => alt.cardId === "cibc_dividend_platinum",
    );
    assert.equal(blue?.multiplier, 2);
    assert.equal(platinum?.multiplier, 3);
    assert.ok(
      (platinum?.estimatedRewardValueCents ?? 0) >
        (blue?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let overstated AIR MILES 3x beat Avion 1x on Metro groceries", () => {
    const decision = route("metro", 80, ["bmo_airmiles", "rbc_avion_infinite"]);
    assert.equal(decision.selectedCardId, "rbc_avion_infinite");
    const blue = decision.alternatives.find((alt) => alt.cardId === "bmo_airmiles");
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(blue?.multiplier, 2);
    assert.equal(avion?.multiplier, 1);
    assert.ok(
      (avion?.estimatedRewardValueCents ?? 0) >
        (blue?.estimatedRewardValueCents ?? 0),
    );
  });

  it("does not let overstated AIR MILES 3x beat Costco MC at Costco warehouse", () => {
    const decision = route("costco", 80, ["bmo_airmiles", "cibc_costco"]);
    assert.equal(decision.selectedCardId, "cibc_costco");
    const blue = decision.alternatives.find((alt) => alt.cardId === "bmo_airmiles");
    const costco = decision.alternatives.find((alt) => alt.cardId === "cibc_costco");
    assert.equal(blue?.multiplier, 2);
    assert.ok(
      (costco?.estimatedRewardValueCents ?? 0) >
        (blue?.estimatedRewardValueCents ?? 0),
    );
  });

  it("awards 2x grocery/gas to $500/mo, 1x else, at Blue Rewards cash value", () => {
    const card = mustCard("bmo_airmiles");
    assert.equal(card.displayName, "BMO Blue Rewards World Elite Mastercard");
    assert.equal(card.annualFee, 150);
    assert.equal(card.currency, "Blue Rewards");
    assert.equal(card.pointValueCents, 0.67);
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "metro").capMonthly, 500);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 2);
    assert.equal(getRewardRule(card, "gas", "shell").capMonthly, 500);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "expedia").multiplier, 1);
  });
});
