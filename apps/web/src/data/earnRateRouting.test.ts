import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CategoryUsage, RewardCategory } from "@onecard/shared-types";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import { getCardById } from "./cards";
import { MERCHANT_PRESETS } from "./merchants";

const FIRST_CLASS = "td_first_class";
const AVION = "rbc_avion_infinite";

function route(
  merchantId: string,
  usage: CategoryUsage[] = [],
  amount = 80,
) {
  const first = getCardById(FIRST_CLASS);
  const avion = getCardById(AVION);
  const merchant = MERCHANT_PRESETS.find((entry) => entry.id === merchantId);
  assert.ok(first, "td_first_class missing from catalog");
  assert.ok(avion, "rbc_avion_infinite missing from catalog");
  assert.ok(merchant, `merchant ${merchantId} missing`);

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
      cards: [first, avion],
      usage,
      preferences: { preferCashback: false },
      defaultCardId: AVION,
    },
  });
}

function cents(merchantId: string, cardId: string, usage?: CategoryUsage[]) {
  const decision = route(merchantId, usage);
  const row = decision.alternatives.find((alt) => alt.cardId === cardId);
  assert.ok(row, `${cardId} missing from alternatives`);
  return row;
}

describe("TD First Class Travel Visa Infinite earn rates", () => {
  it("keeps the 0.5¢ TD Rewards floor and does not copy the grid onto TD Rewards Visa", () => {
    const first = getCardById(FIRST_CLASS)!;
    const rewardsVisa = getCardById("td_rewards_visa")!;
    assert.equal(first.pointValueCents, 0.5);
    assert.equal(first.annualFee, 139);
    assert.deepEqual(
      rewardsVisa.rewards.map((rule) => rule.multiplier),
      [1],
    );
    assert.equal(
      first.rewards.some(
        (rule) => rule.category === "travel" && !rule.merchantIds?.length,
      ),
      false,
    );
  });

  it("picks First Class at 6× for a grocery trip that the 2× stub lost to Avion", () => {
    for (const merchantId of [
      "metro",
      "loblaws",
      "superstore",
      "sobeys",
      "walmart_grocery",
    ]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, FIRST_CLASS, merchantId);
      assert.equal(cents(merchantId, FIRST_CLASS).multiplier, 6);
      assert.equal(cents(merchantId, FIRST_CLASS).estimatedRewardValueCents, 240);
      assert.equal(cents(merchantId, AVION).estimatedRewardValueCents, 112);
    }
  });

  it("keeps Costco warehouse off the grocery bonus", () => {
    const first = getCardById(FIRST_CLASS)!;
    // Costco Canada is Mastercard-only, so the router drops both Visa cards.
    // The earn rule still must not treat warehouse MCC 5300 as 5411 grocery.
    assert.equal(getRewardRule(first, "groceries", "costco").multiplier, 2);
    assert.equal(
      getRewardRule(first, "groceries", "costco_wholesale").multiplier,
      2,
    );
    assert.equal(getRewardRule(first, "other", "walmart").multiplier, 2);
  });

  it("pays 6× on dining, including delivery, and beats Avion", () => {
    for (const merchantId of ["tim_hortons", "uber_eats", "doordash", "starbucks"]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, FIRST_CLASS, merchantId);
      assert.equal(cents(merchantId, FIRST_CLASS).multiplier, 6);
      assert.equal(cents(merchantId, FIRST_CLASS).estimatedRewardValueCents, 240);
    }
  });

  it("pays 6× only on public transit MCC 4111 merchants, not rideshare or VIA", () => {
    for (const merchantId of ["ttc", "presto", "go_transit"]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, FIRST_CLASS, merchantId);
      assert.equal(cents(merchantId, FIRST_CLASS).multiplier, 6);
      assert.equal(cents(merchantId, FIRST_CLASS).estimatedRewardValueCents, 240);
    }

    for (const merchantId of ["uber", "lyft"]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, AVION, merchantId);
      assert.equal(cents(merchantId, FIRST_CLASS).multiplier, 2);
    }
  });

  it("limits 8× to Expedia and leaves direct airlines and hotels at 2×", () => {
    const expedia = route("expedia");
    assert.equal(expedia.selectedCardId, FIRST_CLASS);
    assert.equal(cents("expedia", FIRST_CLASS).multiplier, 8);
    assert.equal(cents("expedia", FIRST_CLASS).estimatedRewardValueCents, 320);

    for (const merchantId of ["air_canada", "marriott", "via_rail"]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, AVION, merchantId);
      assert.equal(cents(merchantId, FIRST_CLASS).multiplier, 2);
      assert.equal(cents(merchantId, FIRST_CLASS).estimatedRewardValueCents, 80);
      assert.ok(
        cents(merchantId, AVION).estimatedRewardValueCents > 80,
        merchantId,
      );
    }
  });

  it("pays 4× on recurring bills, streaming, and digital gaming", () => {
    for (const merchantId of ["netflix", "bell", "steam", "xbox", "playstation", "ea"]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, FIRST_CLASS, merchantId);
      assert.equal(cents(merchantId, FIRST_CLASS).multiplier, 4);
      assert.equal(cents(merchantId, FIRST_CLASS).estimatedRewardValueCents, 160);
    }

    const amazon = route("amazon");
    assert.equal(amazon.selectedCardId, AVION);
    assert.equal(cents("amazon", FIRST_CLASS).multiplier, 2);
  });

  it("drops grocery to the 2× base after the $25,000 cap without touching dining", () => {
    const groceryUsage: CategoryUsage[] = [
      {
        cardId: FIRST_CLASS,
        category: "groceries" satisfies RewardCategory,
        spendThisPeriod: 25000,
      },
    ];
    const capped = route("metro", groceryUsage);
    assert.equal(capped.selectedCardId, AVION);
    assert.equal(cents("metro", FIRST_CLASS, groceryUsage).multiplier, 2);

    const dining = route("tim_hortons", groceryUsage);
    assert.equal(dining.selectedCardId, FIRST_CLASS);
    assert.equal(cents("tim_hortons", FIRST_CLASS, groceryUsage).multiplier, 6);
  });

  it("shares the $25,000 media cap across streaming and recurring bills", () => {
    const mediaUsage: CategoryUsage[] = [
      {
        cardId: FIRST_CLASS,
        category: "streaming",
        spendThisPeriod: 25000,
        sharedCapGroup: "td_first_class_media",
      },
    ];
    const bill = route("bell", mediaUsage);
    assert.equal(cents("bell", FIRST_CLASS, mediaUsage).multiplier, 2);
    assert.equal(bill.selectedCardId, AVION);

    const dining = route("tim_hortons", mediaUsage);
    assert.equal(dining.selectedCardId, FIRST_CLASS);
    assert.equal(cents("tim_hortons", FIRST_CLASS, mediaUsage).multiplier, 6);
  });
});
