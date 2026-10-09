import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage } from "@onecard/shared-types";
import { getCardById } from "./cards";
import { MERCHANT_PRESETS } from "./merchants";

const ALLURE = "nbc_allure";
const AVION = "rbc_avion_infinite";

function route(merchantId: string, usage: CategoryUsage[] = [], amount = 80) {
  const allure = getCardById(ALLURE);
  const avion = getCardById(AVION);
  const merchant = MERCHANT_PRESETS.find((entry) => entry.id === merchantId);
  assert.ok(allure, "nbc_allure missing from catalog");
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
      cards: [allure, avion],
      usage,
      preferences: { preferCashback: false },
      defaultCardId: AVION,
    },
  });
}

function cents(merchantId: string, cardId: string, usage?: CategoryUsage[]) {
  const decision = route(merchantId, usage);
  const row = decision.alternatives.find((alt) => alt.cardId === cardId);
  assert.ok(row, `${cardId} missing from alternatives for ${merchantId}`);
  return row;
}

describe("National Bank Allure Mastercard earn rates", () => {
  it("is the public no-fee cashback card, not the closed À la carte plan", () => {
    const allure = getCardById(ALLURE)!;
    const worldElite = getCardById("nbc_world_elite")!;
    const platinum = getCardById("nbc_platinum")!;

    assert.equal(allure.pointValueCents, 1);
    assert.equal(allure.annualFee, 0);
    assert.equal(allure.network, "mastercard");
    assert.equal(allure.currency, "cashback %");
    assert.equal(
      allure.rewards.some((rule) => rule.category === "dining"),
      false,
    );
    assert.equal(getRewardRule(allure, "dining", "tim_hortons").multiplier, 0.5);

    assert.equal(getRewardRule(worldElite, "dining").multiplier, 2);
    assert.equal(getRewardRule(worldElite, "groceries").multiplier, 2);
    assert.equal(getRewardRule(worldElite, "travel").multiplier, 2);
    assert.equal(getRewardRule(worldElite, "other").multiplier, 1.5);
    assert.equal(getRewardRule(platinum, "dining").multiplier, 2);
    assert.equal(getRewardRule(platinum, "gas").multiplier, 2);
    assert.equal(getRewardRule(platinum, "travel").multiplier, 2);
    assert.equal(getRewardRule(platinum, "other").multiplier, 1.5);
    assert.equal(worldElite.currency, "À la carte points");
    assert.equal(platinum.currency, "À la carte points");
  });

  it("lets Avion win a Tim Hortons trip the 2x dining rate used to steal", () => {
    const decision = route("tim_hortons");
    assert.equal(decision.selectedCardId, AVION);
    assert.equal(cents("tim_hortons", ALLURE).multiplier, 0.5);
    assert.equal(cents("tim_hortons", ALLURE).estimatedRewardValueCents, 40);
    assert.equal(cents("tim_hortons", AVION).estimatedRewardValueCents, 140);
  });

  it("pays 0.5% on other dining, grocery, gas, and travel", () => {
    for (const merchantId of [
      "starbucks",
      "uber_eats",
      "mcdonalds",
      "metro",
      "shell",
      "air_canada",
      "amazon",
    ]) {
      const decision = route(merchantId);
      assert.equal(decision.selectedCardId, AVION, merchantId);
      assert.equal(cents(merchantId, ALLURE).multiplier, 0.5);
      assert.equal(cents(merchantId, ALLURE).estimatedRewardValueCents, 40);
    }
  });

  it("is accepted at Costco as a Mastercard and still earns 0.5%", () => {
    const decision = route("costco");
    assert.equal(decision.selectedCardId, ALLURE);
    assert.equal(decision.alternatives.some((alt) => alt.cardId === AVION), false);
    assert.equal(cents("costco", ALLURE).multiplier, 0.5);
    assert.equal(cents("costco", ALLURE).estimatedRewardValueCents, 40);
  });
});
