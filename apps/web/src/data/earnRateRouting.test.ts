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

describe("Scotia Passport earns Scene+ on grocery, dining, entertainment, and transit", () => {
  const wallet = ["scotia_passport", "rbc_avion_infinite"] as const;

  it("beats Avion at Sobeys banners and at other grocery stores", () => {
    for (const merchantId of ["sobeys", "safeway", "iga", "freshco"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_passport", merchantId);
      const passport = decision.alternatives.find((alt) => alt.cardId === "scotia_passport");
      assert.equal(passport?.multiplier, 3, merchantId);
      assert.equal(passport?.estimatedRewardValueCents, 240, merchantId);
    }

    for (const merchantId of ["metro", "loblaws", "superstore", "walmart_grocery"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_passport", merchantId);
      const passport = decision.alternatives.find((alt) => alt.cardId === "scotia_passport");
      const avion = decision.alternatives.find((alt) => alt.cardId === "rbc_avion_infinite");
      assert.equal(passport?.multiplier, 2, merchantId);
      assert.equal(passport?.estimatedRewardValueCents, 160, merchantId);
      assert.ok(
        (passport?.estimatedRewardValueCents ?? 0) >
          (avion?.estimatedRewardValueCents ?? 0),
      );
    }
  });

  it("beats Avion on dining, entertainment, and daily transit", () => {
    for (const merchantId of ["tim_hortons", "uber_eats", "doordash"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_passport", merchantId);
      const passport = decision.alternatives.find((alt) => alt.cardId === "scotia_passport");
      assert.equal(passport?.multiplier, 2, merchantId);
      assert.equal(passport?.estimatedRewardValueCents, 160, merchantId);
    }

    for (const merchantId of [
      "cineplex",
      "amc",
      "ticketmaster",
      "uber",
      "lyft",
      "ttc",
      "presto",
      "go_transit",
      "via_rail",
    ]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "scotia_passport", merchantId);
      const passport = decision.alternatives.find((alt) => alt.cardId === "scotia_passport");
      assert.equal(passport?.multiplier, 2, merchantId);
      assert.equal(passport?.estimatedRewardValueCents, 160, merchantId);
    }
  });

  it("does not treat direct travel, gas, or general retail as an accelerator", () => {
    for (const merchantId of [
      "air_canada",
      "westjet",
      "marriott",
      "hilton",
      "expedia",
      "hertz",
      "shell",
      "amazon",
      "walmart",
      "netflix",
      "steam",
    ]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      const passport = decision.alternatives.find((alt) => alt.cardId === "scotia_passport");
      assert.equal(passport?.multiplier, 1, merchantId);
      assert.equal(passport?.estimatedRewardValueCents, 80, merchantId);
    }
  });

  it("drops grocery and dining to 1× after the shared $50,000 annual bonus", () => {
    const usage: CategoryUsage[] = [
      {
        cardId: "scotia_passport",
        category: "groceries",
        spendThisPeriod: 50000,
        sharedCapGroup: "scotia_passport_bonus",
      },
    ];
    for (const merchantId of ["metro", "tim_hortons"]) {
      const decision = route(merchantId, 80, [...wallet], usage);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      const passport = decision.alternatives.find((alt) => alt.cardId === "scotia_passport");
      assert.equal(passport?.multiplier, 1, merchantId);
      assert.equal(passport?.estimatedRewardValueCents, 80, merchantId);
    }
  });

  it("keeps Costco warehouse off the grocery bonus and does not copy the grid onto other Scotia cards", () => {
    const card = mustCard("scotia_passport");
    assert.equal(card.displayName, "Scotiabank Passport Visa Infinite Card");
    assert.equal(card.annualFee, 150);
    assert.equal(card.currency, "Scene+ points");
    assert.equal(card.pointValueCents, 1);
    assert.equal(card.network, "visa");

    const sobeys = getRewardRule(card, "groceries", "sobeys");
    assert.equal(sobeys.multiplier, 3);
    assert.equal(sobeys.capAnnual, 50000);
    assert.equal(sobeys.sharedCapGroup, "scotia_passport_bonus");
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
    assert.equal(getRewardRule(card, "groceries", "costco_wholesale").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "marriott").multiplier, 1);
    assert.equal(getRewardRule(card, "travel", "via_rail").multiplier, 2);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "cineplex").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "uber").multiplier, 2);
    assert.equal(getRewardRule(card, "other", "steam").multiplier, 1);

    const scene = mustCard("scotia_scene");
    assert.equal(getRewardRule(scene, "groceries", "sobeys").multiplier, 2);
    assert.equal(getRewardRule(scene, "groceries", "metro").multiplier, 1);
    assert.equal(getRewardRule(scene, "travel", "air_canada").multiplier, 1);

    const gold = mustCard("scotia_gold_amex");
    assert.equal(getRewardRule(gold, "groceries", "sobeys").multiplier, 3);
    assert.equal(getRewardRule(gold, "groceries", "metro").multiplier, 1);
    assert.equal(getRewardRule(gold, "dining", "tim_hortons").multiplier, 5);
    assert.equal(getRewardRule(gold, "gas", "shell").multiplier, 3);
    assert.equal(getRewardRule(gold, "travel", "air_canada").multiplier, 1);
  });
});
