import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, CategoryUsage, RoutingDecision } from "@onecard/shared-types";
import { getCardById } from "./cards";
import { merchantById } from "./merchants";

const CARD_ID = "td_aeroplan_infinite_privilege";

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

describe("TD Aeroplan Visa Infinite Privilege is not a 1x stub", () => {
  it("beats Avion on featured grocery, gas, and dining purchases", () => {
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    const metro = route("metro", 80, wallet);
    assert.equal(metro.selectedCardId, CARD_ID);
    assert.equal(alt(metro, CARD_ID)?.multiplier, 1.5);
    assert.ok(
      (alt(metro, CARD_ID)?.estimatedRewardValueCents ?? 0) >
        (alt(metro, "rbc_avion_infinite")?.estimatedRewardValueCents ?? 0) +
          100,
    );

    const shell = route("shell", 80, wallet);
    assert.equal(shell.selectedCardId, CARD_ID);
    assert.equal(alt(shell, CARD_ID)?.multiplier, 1.5);
    assert.ok(
      (alt(shell, CARD_ID)?.estimatedRewardValueCents ?? 0) >
        (alt(shell, "rbc_avion_infinite")?.estimatedRewardValueCents ?? 0) +
          100,
    );

    const tims = route("tim_hortons", 80, wallet);
    assert.equal(tims.selectedCardId, CARD_ID);
    assert.equal(alt(tims, CARD_ID)?.multiplier, 1.5);
    assert.ok(
      (alt(tims, CARD_ID)?.estimatedRewardValueCents ?? 0) >
        (alt(tims, "rbc_avion_infinite")?.estimatedRewardValueCents ?? 0) + 80,
    );
  });

  it("pays 2x on direct Air Canada and 1.5x on other travel and local transit", () => {
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    const airCanada = route("air_canada", 80, wallet);
    assert.equal(airCanada.selectedCardId, CARD_ID);
    assert.equal(alt(airCanada, CARD_ID)?.multiplier, 2);
    assert.ok(
      (alt(airCanada, CARD_ID)?.estimatedRewardValueCents ?? 0) >
        (alt(airCanada, "rbc_avion_infinite")?.estimatedRewardValueCents ?? 0) +
          100,
    );

    for (const merchantId of ["westjet", "marriott", "hilton", "via_rail"] as const) {
      const decision = route(merchantId, 80, wallet);
      assert.equal(decision.selectedCardId, CARD_ID, merchantId);
      assert.equal(alt(decision, CARD_ID)?.multiplier, 1.5, merchantId);
    }

    for (const merchantId of ["uber", "ttc", "presto", "go_transit"] as const) {
      const decision = route(merchantId, 80, wallet);
      assert.equal(decision.selectedCardId, CARD_ID, merchantId);
      assert.equal(alt(decision, CARD_ID)?.multiplier, 1.5, merchantId);
    }
  });

  it("uses the 1.25x base on everyday spend and keeps warehouse clubs off the grocery bonus", () => {
    const wallet = [CARD_ID, "rbc_avion_infinite"];

    const amazon = route("amazon", 80, wallet);
    assert.equal(amazon.selectedCardId, CARD_ID);
    assert.equal(alt(amazon, CARD_ID)?.multiplier, 1.25);
    assert.ok(
      (alt(amazon, CARD_ID)?.estimatedRewardValueCents ?? 0) >
        (alt(amazon, "rbc_avion_infinite")?.estimatedRewardValueCents ?? 0),
    );

    const netflix = route("netflix", 80, wallet);
    assert.equal(alt(netflix, CARD_ID)?.multiplier, 1.25);

    const card = mustCard(CARD_ID);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 1.5);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1.25);
    assert.equal(getRewardRule(card, "other", "costco_wholesale").multiplier, 1.25);
  });

  it("drops bonus categories to 1.25x after the shared $100,000 annual cap", () => {
    const capped: CategoryUsage[] = [
      {
        cardId: CARD_ID,
        category: "groceries",
        spendThisPeriod: 100_000,
        sharedCapGroup: "td_aeroplan_vip_bonus",
      },
    ];
    const metro = route("metro", 80, [CARD_ID, "rbc_avion_infinite"], capped);
    assert.equal(alt(metro, CARD_ID)?.multiplier, 1.25);
    assert.equal(alt(metro, CARD_ID)?.cappedOut, true);

    const tims = route("tim_hortons", 80, [CARD_ID, "rbc_avion_infinite"], capped);
    assert.equal(alt(tims, CARD_ID)?.multiplier, 1.25);
  });

  it("stores the issuer fee, Aeroplan point value, and earn rules", () => {
    const card = mustCard(CARD_ID);
    assert.equal(card.displayName, "TD Aeroplan Visa Infinite Privilege Card");
    assert.equal(card.annualFee, 599);
    assert.equal(card.currency, "Aeroplan points");
    assert.equal(card.pointValueCents, 2);
    assert.equal(card.network, "visa");
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 2);
    assert.equal(getRewardRule(card, "travel", "westjet").multiplier, 1.5);
    assert.equal(getRewardRule(card, "travel", "expedia").multiplier, 1.5);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1.5);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1.5);
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 1.5);
    assert.equal(getRewardRule(card, "other", "uber").multiplier, 1.5);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1.25);
    assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 1.25);
    assert.equal(getRewardRule(card, "recurring_bills", "rogers").multiplier, 1.25);
  });
});
