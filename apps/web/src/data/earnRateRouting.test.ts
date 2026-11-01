import assert from "node:assert/strict";
import { test } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";

const STUDENT = "scotia_scene_student";
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

test("Scene+ Visa for students beats Avion at Sobeys banners and Cineplex", () => {
  const card = getCardById(STUDENT);
  assert.ok(card);
  assert.equal(card.annualFee, 0);
  assert.equal(card.pointValueCents, 1);
  assert.equal(card.network, "visa");
  assert.equal(card.currency, "Scene+ points");

  for (const merchantId of ["sobeys", "safeway", "iga", "freshco", "cineplex"]) {
    const decision = route([STUDENT, AVION], merchantId);
    assert.equal(decision.selectedCardId, STUDENT, merchantId);
    assert.equal(decision.multiplier, 2, merchantId);
    assert.equal(decision.estimatedRewardValueCents, 160, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 112, merchantId);
  }

  // Aeroplan Infinite is also 2% at these merchants (1× at 2¢). Do not claim a win.
  const sobeysVsAeroplan = route([STUDENT, AEROPLAN], "sobeys");
  assert.equal(sobeysVsAeroplan.estimatedRewardValueCents, 160);
  assert.equal(sobeysVsAeroplan.estimatedRewardValueNextBestCents, 160);
});

test("other grocery, Shell, dining, and travel stay at 1 Scene+ and lose to Avion", () => {
  for (const merchantId of [
    "metro",
    "walmart_grocery",
    "loblaws",
    "shell",
    "tim_hortons",
    "air_canada",
    "netflix",
  ]) {
    const decision = route([STUDENT, AVION], merchantId);
    assert.equal(decision.selectedCardId, AVION, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 80, merchantId);
  }

  const card = getCardById(STUDENT);
  assert.ok(card);
  assert.equal(getRewardRule(card, "groceries", "sobeys").multiplier, 2);
  assert.equal(getRewardRule(card, "groceries", "sobeys").capAnnual, undefined);
  assert.equal(getRewardRule(card, "groceries", "sobeys").capMonthly, undefined);
  assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 1);
  assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 1);
  assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
  assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
  assert.equal(getRewardRule(card, "other", "cineplex").multiplier, 2);
  assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1);
  assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1);
  assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 1);
});

test("Shell stays at 1 Scene+ so Aeroplan Infinite keeps the gas purchase", () => {
  const gas = route([STUDENT, AEROPLAN], "shell");
  assert.equal(gas.selectedCardId, AEROPLAN);
  assert.equal(gas.estimatedRewardValueCents, 240);
  assert.equal(gas.estimatedRewardValueNextBestCents, 80);
});

test("adult Scene+ and student Momentum keep their own earn models", () => {
  const adult = getCardById("scotia_scene");
  assert.ok(adult);
  assert.equal(getRewardRule(adult, "groceries", "sobeys").multiplier, 2);
  assert.equal(getRewardRule(adult, "gas", "shell").multiplier, 2);
  assert.equal(getRewardRule(adult, "other", "cineplex").multiplier, 2);

  const momentumStudent = getCardById("scotia_momentum_student");
  assert.ok(momentumStudent);
  assert.equal(momentumStudent.currency, "issuer rewards");
  assert.equal(getRewardRule(momentumStudent, "groceries", "sobeys").multiplier, 1);
  assert.equal(getRewardRule(momentumStudent, "groceries", "metro").multiplier, 1);
});
