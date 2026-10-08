import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CategoryUsage, RewardCategory } from "@onecard/shared-types";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import { getCardById } from "./cards";
import { MERCHANT_PRESETS } from "./merchants";

const TRIANGLE = "triangle_mastercard";
const AVION = "rbc_avion_infinite";

function route(
  merchantId: string,
  usage: CategoryUsage[] = [],
  amount = 80,
) {
  const triangle = getCardById(TRIANGLE);
  const avion = getCardById(AVION);
  const merchant = MERCHANT_PRESETS.find((entry) => entry.id === merchantId);
  assert.ok(triangle, "triangle_mastercard missing from catalog");
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
      cards: [triangle, avion],
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

describe("Triangle Mastercard earn rates", () => {
  it("keeps CT Money at $1 and does not copy the grid onto World Elite or Cash Advantage", () => {
    const triangle = getCardById(TRIANGLE)!;
    const worldElite = getCardById("triangle_world_elite")!;
    const cashAdvantage = getCardById("triangle_cash_advantage")!;
    assert.equal(triangle.pointValueCents, 1);
    assert.equal(triangle.annualFee, 0);
    assert.equal(triangle.network, "mastercard");
    assert.deepEqual(
      worldElite.rewards.map((rule) => rule.multiplier),
      [1],
    );
    assert.deepEqual(
      cashAdvantage.rewards.map((rule) => rule.multiplier),
      [1],
    );
    assert.equal(
      triangle.rewards.some(
        (rule) => rule.category === "gas" && !rule.merchantIds?.length,
      ),
      false,
    );
  });

  it("picks Triangle at 4% for a Canadian Tire trip the 1% stub lost to Avion", () => {
    const decision = route("canadian_tire");
    assert.equal(decision.selectedCardId, TRIANGLE);
    assert.equal(cents("canadian_tire", TRIANGLE).multiplier, 4);
    assert.equal(cents("canadian_tire", TRIANGLE).estimatedRewardValueCents, 320);
    assert.equal(cents("canadian_tire", AVION).estimatedRewardValueCents, 112);
  });

  it("pays 1.5% at eligible grocers and beats Avion's 1.4% base", () => {
    for (const merchantId of ["metro", "loblaws", "superstore", "sobeys"]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, TRIANGLE, merchantId);
      assert.equal(cents(merchantId, TRIANGLE).multiplier, 1.5);
      assert.equal(cents(merchantId, TRIANGLE).estimatedRewardValueCents, 120);
      assert.equal(cents(merchantId, AVION).estimatedRewardValueCents, 112);
    }
  });

  it("keeps Costco and Walmart off the grocery bonus", () => {
    const triangle = getCardById(TRIANGLE)!;
    assert.equal(getRewardRule(triangle, "groceries", "costco").multiplier, 0.5);
    assert.equal(
      getRewardRule(triangle, "groceries", "costco_wholesale").multiplier,
      0.5,
    );
    assert.equal(
      getRewardRule(triangle, "groceries", "walmart_grocery").multiplier,
      0.5,
    );
    assert.equal(getRewardRule(triangle, "other", "walmart").multiplier, 0.5);

    const walmartGrocery = route("walmart_grocery");
    assert.equal(walmartGrocery.selectedCardId, AVION);
    assert.equal(cents("walmart_grocery", TRIANGLE).estimatedRewardValueCents, 40);
  });

  it("leaves fuel, dining, travel, and other retail at 0.5% so Avion still wins", () => {
    for (const merchantId of [
      "shell",
      "petro_canada",
      "canadian_tire_gas",
      "tim_hortons",
      "air_canada",
      "amazon",
    ]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, AVION, merchantId);
      assert.equal(cents(merchantId, TRIANGLE).multiplier, 0.5);
      assert.equal(cents(merchantId, TRIANGLE).estimatedRewardValueCents, 40);
    }
  });

  it("drops grocery to the 0.5% base after the $12,000 cap", () => {
    const groceryUsage: CategoryUsage[] = [
      {
        cardId: TRIANGLE,
        category: "groceries" satisfies RewardCategory,
        spendThisPeriod: 12000,
      },
    ];
    const capped = route("metro", groceryUsage);
    assert.equal(capped.selectedCardId, AVION);
    assert.equal(cents("metro", TRIANGLE, groceryUsage).multiplier, 0.5);
    assert.equal(
      cents("metro", TRIANGLE, groceryUsage).estimatedRewardValueCents,
      40,
    );

    const banner = route("canadian_tire", groceryUsage);
    assert.equal(banner.selectedCardId, TRIANGLE);
    assert.equal(cents("canadian_tire", TRIANGLE, groceryUsage).multiplier, 4);
  });
});
