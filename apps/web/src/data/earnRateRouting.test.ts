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

describe("TD Platinum Travel earns TD Rewards on grocery, dining, transit, and media", () => {
  const wallet = ["td_platinum_travel", "rbc_avion_infinite"] as const;

  it("beats Avion on grocery stores, including Walmart Grocery", () => {
    for (const merchantId of ["metro", "loblaws", "superstore", "sobeys", "walmart_grocery"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "td_platinum_travel", merchantId);
      const platinum = decision.alternatives.find((alt) => alt.cardId === "td_platinum_travel");
      const avion = decision.alternatives.find((alt) => alt.cardId === "rbc_avion_infinite");
      assert.equal(platinum?.multiplier, 4.5, merchantId);
      assert.equal(platinum?.estimatedRewardValueCents, 180, merchantId);
      assert.ok(
        (platinum?.estimatedRewardValueCents ?? 0) > (avion?.estimatedRewardValueCents ?? 0),
        merchantId,
      );
    }
  });

  it("beats Avion on restaurants and food delivery", () => {
    for (const merchantId of ["tim_hortons", "uber_eats", "doordash", "starbucks"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "td_platinum_travel", merchantId);
      const platinum = decision.alternatives.find((alt) => alt.cardId === "td_platinum_travel");
      const avion = decision.alternatives.find((alt) => alt.cardId === "rbc_avion_infinite");
      assert.equal(platinum?.multiplier, 4.5, merchantId);
      assert.equal(platinum?.estimatedRewardValueCents, 180, merchantId);
      assert.ok((avion?.estimatedRewardValueCents ?? 0) < 180, merchantId);
    }
  });

  it("beats Avion on local transit coded as other, not on rideshare or rail", () => {
    for (const merchantId of ["ttc", "presto", "go_transit", "mta", "clipper"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "td_platinum_travel", merchantId);
      const platinum = decision.alternatives.find((alt) => alt.cardId === "td_platinum_travel");
      assert.equal(platinum?.multiplier, 4.5, merchantId);
      assert.equal(platinum?.estimatedRewardValueCents, 180, merchantId);
    }

    for (const merchantId of ["uber", "lyft", "via_rail"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      const platinum = decision.alternatives.find((alt) => alt.cardId === "td_platinum_travel");
      assert.equal(platinum?.multiplier, 1.5, merchantId);
      assert.equal(platinum?.estimatedRewardValueCents, 60, merchantId);
    }
  });

  it("beats Avion on streaming, gaming, and recurring bills, and leaves portal travel at the base rate", () => {
    for (const merchantId of ["netflix", "spotify", "steam", "xbox", "bell", "hydro_one"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "td_platinum_travel", merchantId);
      const platinum = decision.alternatives.find((alt) => alt.cardId === "td_platinum_travel");
      assert.equal(platinum?.multiplier, 3, merchantId);
      assert.equal(platinum?.estimatedRewardValueCents, 120, merchantId);
    }

    for (const merchantId of ["air_canada", "marriott", "expedia", "shell", "amazon", "walmart"]) {
      const decision = route(merchantId, 80, [...wallet]);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      const platinum = decision.alternatives.find((alt) => alt.cardId === "td_platinum_travel");
      assert.equal(platinum?.multiplier, 1.5, merchantId);
      assert.equal(platinum?.estimatedRewardValueCents, 60, merchantId);
    }
  });

  it("drops each bonus category to 1.5x on its own $15,000 cap", () => {
    const groceryFull: CategoryUsage[] = [
      {
        cardId: "td_platinum_travel",
        category: "groceries",
        spendThisPeriod: 15000,
      },
    ];
    const groceryDecision = route("metro", 80, [...wallet], groceryFull);
    assert.equal(groceryDecision.selectedCardId, "rbc_avion_infinite");
    const groceryPlatinum = groceryDecision.alternatives.find(
      (alt) => alt.cardId === "td_platinum_travel",
    );
    assert.equal(groceryPlatinum?.multiplier, 1.5);
    assert.equal(groceryPlatinum?.estimatedRewardValueCents, 60);

    const diningStillBonus = route("tim_hortons", 80, [...wallet], groceryFull);
    assert.equal(diningStillBonus.selectedCardId, "td_platinum_travel");
    assert.equal(
      diningStillBonus.alternatives.find((alt) => alt.cardId === "td_platinum_travel")
        ?.multiplier,
      4.5,
    );

    const mediaFull: CategoryUsage[] = [
      {
        cardId: "td_platinum_travel",
        category: "streaming",
        spendThisPeriod: 15000,
        sharedCapGroup: "td_platinum_travel_media",
      },
    ];
    for (const merchantId of ["netflix", "bell"]) {
      const decision = route(merchantId, 80, [...wallet], mediaFull);
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      const platinum = decision.alternatives.find((alt) => alt.cardId === "td_platinum_travel");
      assert.equal(platinum?.multiplier, 1.5, merchantId);
      assert.equal(platinum?.estimatedRewardValueCents, 60, merchantId);
    }
  });

  it("keeps Costco warehouse off the grocery bonus and does not copy the grid onto other TD Rewards cards", () => {
    const card = mustCard("td_platinum_travel");
    assert.equal(card.displayName, "TD Platinum Travel Visa Card");
    assert.equal(card.annualFee, 89);
    assert.equal(card.currency, "TD Rewards");
    assert.equal(card.pointValueCents, 0.5);
    assert.equal(card.network, "visa");

    const grocery = getRewardRule(card, "groceries", "metro");
    assert.equal(grocery.multiplier, 4.5);
    assert.equal(grocery.capAnnual, 15000);
    assert.equal(grocery.sharedCapGroup, undefined);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1.5);
    assert.equal(getRewardRule(card, "groceries", "costco_wholesale").multiplier, 1.5);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 4.5);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 4.5);
    assert.equal(getRewardRule(card, "other", "ttc").multiplier, 4.5);
    assert.equal(getRewardRule(card, "other", "uber").multiplier, 1.5);
    assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 3);
    assert.equal(getRewardRule(card, "other", "steam").multiplier, 3);
    assert.equal(getRewardRule(card, "travel", "expedia").multiplier, 1.5);
    assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1.5);

    const rewardsVisa = mustCard("td_rewards_visa");
    assert.equal(getRewardRule(rewardsVisa, "groceries", "metro").multiplier, 1);
    assert.equal(rewardsVisa.pointValueCents, 0.5);

    const firstClass = mustCard("td_first_class");
    assert.equal(getRewardRule(firstClass, "groceries", "metro").multiplier, 2);
    assert.equal(getRewardRule(firstClass, "travel", "expedia").multiplier, 8);
    assert.equal(firstClass.annualFee, 139);
  });
});
