import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RoutingDecision } from "@onecard/shared-types";
import { getCardById } from "./cards";
import { merchantById } from "./merchants";

const DEFAULT_WALLET = [
  "amex_cobalt",
  "cibc_dividend_infinite",
  "scotia_momentum",
  "rbc_ion",
] as const;

function mustCard(id: string): CardProduct {
  const card = getCardById(id);
  assert.ok(card, `missing catalog card ${id}`);
  return card;
}

function route(
  merchantId: string,
  amount: number,
  extraCardIds: string[] = [],
): RoutingDecision {
  const merchant = merchantById(merchantId);
  assert.ok(merchant, `missing merchant ${merchantId}`);
  const cardIds = [...DEFAULT_WALLET, ...extraCardIds];
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
      defaultCardId: "cibc_dividend_infinite",
    },
  });
}

describe("airline co-brand travel bonuses are merchant-scoped", () => {
  it("does not let CIBC Aeroplan Infinite beat Cobalt at WestJet", () => {
    const decision = route("westjet", 1000, ["cibc_aeroplan_infinite"]);
    assert.equal(decision.selectedCardId, "amex_cobalt");
    const aeroplan = decision.alternatives.find(
      (alt) => alt.cardId === "cibc_aeroplan_infinite",
    );
    assert.ok(aeroplan);
    assert.equal(aeroplan.multiplier, 1);
    assert.ok(
      aeroplan.estimatedRewardValueCents < decision.estimatedRewardValueCents ||
        aeroplan.cardId > decision.selectedCardId,
    );
  });

  it("still awards CIBC Aeroplan Infinite 1.5x on Air Canada", () => {
    const decision = route("air_canada", 1000, ["cibc_aeroplan_infinite"]);
    assert.equal(decision.selectedCardId, "cibc_aeroplan_infinite");
    assert.equal(decision.multiplier, 1.5);
  });

  it("does not let TD Aeroplan Infinite beat Cobalt at WestJet", () => {
    const decision = route("westjet", 1000, ["td_aeroplan_infinite"]);
    assert.equal(decision.selectedCardId, "amex_cobalt");
    const aeroplan = decision.alternatives.find(
      (alt) => alt.cardId === "td_aeroplan_infinite",
    );
    assert.equal(aeroplan?.multiplier, 1);
  });

  it("still awards TD Aeroplan Infinite 1.5x on Air Canada", () => {
    const decision = route("air_canada", 1000, ["td_aeroplan_infinite"]);
    assert.equal(decision.selectedCardId, "td_aeroplan_infinite");
    assert.equal(decision.multiplier, 1.5);
  });

  it("does not let Amex Green 2x-all-travel beat Cobalt at Air Canada", () => {
    const decision = route("air_canada", 1000, ["amex_green"]);
    assert.equal(decision.selectedCardId, "amex_cobalt");
    const green = decision.alternatives.find((alt) => alt.cardId === "amex_green");
    assert.equal(green?.multiplier, 1);
  });

  it("does not let WestJet RBC 3x beat Cobalt at WestJet", () => {
    const decision = route("westjet", 1000, ["rbc_westjet"]);
    assert.equal(decision.selectedCardId, "amex_cobalt");
    const westjet = decision.alternatives.find((alt) => alt.cardId === "rbc_westjet");
    assert.equal(westjet?.multiplier, 2);
    assert.equal(
      westjet?.estimatedRewardValueCents,
      decision.estimatedRewardValueCents,
    );
  });

  it("does not let TD Aeroplan Platinum 1.5x-all-travel beat Cobalt at WestJet", () => {
    const decision = route("westjet", 1000, ["td_aeroplan_platinum"]);
    assert.equal(decision.selectedCardId, "amex_cobalt");
    const platinum = decision.alternatives.find(
      (alt) => alt.cardId === "td_aeroplan_platinum",
    );
    assert.equal(platinum?.multiplier, 1);
  });
});

describe("CIBC Aeroplan Infinite everyday categories match issuer table", () => {
  it("earns 1.5x at Metro groceries", () => {
    const card = mustCard("cibc_aeroplan_infinite");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 1.5);
  });

  it("earns 1x dining rather than a fabricated 1.5x", () => {
    const card = mustCard("cibc_aeroplan_infinite");
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1);
    const decision = route("tim_hortons", 80, ["cibc_aeroplan_infinite"]);
    assert.equal(decision.selectedCardId, "amex_cobalt");
  });
});
