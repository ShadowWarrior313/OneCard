import assert from "node:assert/strict";
import { test } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";

const BA = "rbc_british_airways_infinite";
const AVION = "rbc_avion_infinite";
const AEROPLAN = "cibc_aeroplan_infinite";

function route(cardIds: string[], merchantId: string, amount = 80) {
  const merchant = merchantById(merchantId);
  assert.ok(merchant, merchantId);
  const cards = cardIds.map((id) => {
    const card = getCardById(id);
    assert.ok(card, id);
    return card;
  });
  return routeTransaction({
    mode: "virtual_provisioning",
    transaction: {
      amount,
      merchantName: merchant.name,
      mcc: merchant.mcc,
      merchantId: merchant.id,
      category: merchant.category,
    },
    portfolio: {
      cards,
      usage: [],
      preferences: { preferCashback: false },
      defaultCardId: cardIds[0],
    },
  });
}

test("British Airways Visa Infinite beats Avion on dining and food delivery", () => {
  const card = getCardById(BA);
  assert.ok(card);
  assert.equal(card.annualFee, 165);
  assert.equal(card.pointValueCents, 1);
  assert.equal(card.network, "visa");
  assert.equal(card.currency, "Avios");

  // Issuer: 2 Avios per $1 on MCC 5812/5813/5814, including food delivery.
  // 1 Avios = 1¢ keeps everyday spend under Avion. At that floor, 2× is $1.60
  // versus Avion dining at $1.40.
  for (const merchantId of ["tim_hortons", "mcdonalds", "uber_eats", "doordash", "skip"]) {
    const decision = route([BA, AVION], merchantId);
    assert.equal(decision.selectedCardId, BA, merchantId);
    assert.equal(decision.multiplier, 2, merchantId);
    assert.equal(decision.estimatedRewardValueCents, 160, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 140, merchantId);
  }
});

test("British Airways 1 Avios base loses grocery, gas, and airlines to Avion", () => {
  for (const merchantId of ["metro", "walmart_grocery", "shell", "air_canada", "netflix"]) {
    const decision = route([BA, AVION], merchantId);
    assert.equal(decision.selectedCardId, AVION, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 80, merchantId);
  }

  const card = getCardById(BA);
  assert.ok(card);
  assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 2);
  assert.equal(getRewardRule(card, "dining", "uber_eats").multiplier, 2);
  assert.equal(getRewardRule(card, "dining", "tim_hortons").capAnnual, undefined);
  assert.equal(getRewardRule(card, "dining", "tim_hortons").capMonthly, undefined);
  // 3 Avios is British Airways MCC 3005 only. Do not blanket Air Canada or other travel.
  assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1);
  assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 1);
  assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
  assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 1);
});

test("Aeroplan Infinite keeps dining and gas ahead of the 1¢ Avios floor", () => {
  const dining = route([BA, AEROPLAN], "tim_hortons");
  assert.equal(dining.selectedCardId, AEROPLAN);
  assert.equal(dining.estimatedRewardValueCents, 240);
  assert.equal(dining.estimatedRewardValueNextBestCents, 160);

  const gas = route([BA, AEROPLAN], "shell");
  assert.equal(gas.selectedCardId, AEROPLAN);
  assert.equal(gas.estimatedRewardValueCents, 240);
  assert.equal(gas.estimatedRewardValueNextBestCents, 80);
});
