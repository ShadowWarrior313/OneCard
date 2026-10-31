import assert from "node:assert/strict";
import { test } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage } from "@onecard/shared-types";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";

const STUDENT = "scotia_momentum_student";
const AVION = "rbc_avion_infinite";
const AEROPLAN = "cibc_aeroplan_infinite";

function route(
  cardIds: string[],
  merchantId: string,
  amount = 80,
  usage: CategoryUsage[] = [],
) {
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
      usage,
      preferences: { preferCashback: false },
      defaultCardId: cardIds[0],
    },
  });
}

test("Scotia Momentum Visa for students beats Avion where the 1% stub loses", () => {
  const card = getCardById(STUDENT);
  assert.ok(card);
  assert.equal(card.annualFee, 49);
  assert.equal(card.pointValueCents, 1);
  assert.equal(card.network, "visa");
  assert.equal(card.currency, "cashback %");

  for (const merchantId of [
    "metro",
    "loblaws",
    "superstore",
    "walmart_grocery",
    "sobeys",
  ]) {
    const decision = route([STUDENT, AVION], merchantId);
    assert.equal(decision.selectedCardId, STUDENT, merchantId);
    assert.equal(decision.multiplier, 2, merchantId);
    assert.equal(decision.estimatedRewardValueCents, 160, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 112, merchantId);
  }

  for (const merchantId of [
    "shell",
    "shoppers",
    "rexall",
    "london_drugs",
    "uber",
    "lyft",
    "ttc",
    "presto",
    "go_transit",
    "bell",
    "hydro_one",
  ]) {
    const decision = route([STUDENT, AVION], merchantId);
    assert.equal(decision.selectedCardId, STUDENT, merchantId);
    assert.equal(decision.multiplier, 2, merchantId);
    assert.equal(decision.estimatedRewardValueCents, 160, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 112, merchantId);
  }

  // VIA Rail is catalogued as travel, so Avion earns 1.25× ($1.40). MCC 4112 is still 2%.
  const via = route([STUDENT, AVION], "via_rail");
  assert.equal(via.selectedCardId, STUDENT);
  assert.equal(via.multiplier, 2);
  assert.equal(via.estimatedRewardValueCents, 160);
  assert.equal(via.estimatedRewardValueNextBestCents, 140);

  // Aeroplan Infinite gas is 1.5× at 2¢ ($2.40). The student 2% rate must not win.
  const gasVsAeroplan = route([STUDENT, AEROPLAN], "shell");
  assert.equal(gasVsAeroplan.selectedCardId, AEROPLAN);
  assert.equal(gasVsAeroplan.estimatedRewardValueCents, 240);
  assert.equal(gasVsAeroplan.estimatedRewardValueNextBestCents, 160);
});

test("dining, delivery, streaming, warehouse, and general retail stay at 1%", () => {
  const card = getCardById(STUDENT);
  assert.ok(card);

  for (const merchantId of [
    "tim_hortons",
    "uber_eats",
    "doordash",
    "skip",
    "netflix",
    "spotify",
    "amazon",
    "walmart",
  ]) {
    const decision = route([STUDENT, AVION], merchantId);
    assert.equal(decision.selectedCardId, AVION, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 80, merchantId);
  }

  assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
  assert.equal(getRewardRule(card, "groceries", "metro").capAnnual, 25000);
  assert.equal(
    getRewardRule(card, "groceries", "metro").sharedCapGroup,
    "scotia_momentum_student_bonus",
  );
  assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
  assert.equal(getRewardRule(card, "groceries", "costco_wholesale").multiplier, 1);
  assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 1);
  assert.equal(getRewardRule(card, "dining", "uber_eats").multiplier, 1);
  assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 1);
  assert.equal(getRewardRule(card, "other", "shoppers").multiplier, 2);
  assert.equal(getRewardRule(card, "travel", "via_rail").multiplier, 2);
  assert.equal(getRewardRule(card, "gas", "shell").multiplier, 2);
});

test("the $25,000 accelerated cap is shared, then the card falls back to 1%", () => {
  const spent: CategoryUsage[] = [
    {
      cardId: STUDENT,
      category: "groceries",
      spendThisPeriod: 25000,
      sharedCapGroup: "scotia_momentum_student_bonus",
    },
  ];

  for (const merchantId of ["metro", "shell", "bell"]) {
    const decision = route([STUDENT, AVION], merchantId, 80, spent);
    assert.equal(decision.selectedCardId, AVION, merchantId);
    assert.equal(decision.estimatedRewardValueCents, 112, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 80, merchantId);
  }

  const uncapped = route([STUDENT, AVION], "metro");
  assert.equal(uncapped.selectedCardId, STUDENT);
  assert.equal(uncapped.estimatedRewardValueCents, 160);
});

test("sibling Scotia Momentum cards keep their own earn models", () => {
  const infinite = getCardById("scotia_momentum");
  assert.ok(infinite);
  assert.equal(getRewardRule(infinite, "groceries", "metro").multiplier, 4);
  assert.equal(getRewardRule(infinite, "groceries", "metro").capMonthly, 250);
  assert.equal(getRewardRule(infinite, "groceries", "metro").capAnnual, undefined);

  const adult = getCardById("scotia_momentum_visa");
  assert.ok(adult);
  assert.equal(adult.currency, "issuer rewards");
  assert.equal(adult.annualFee, undefined);
  assert.equal(getRewardRule(adult, "groceries", "metro").multiplier, 1);

  const noFee = getCardById("scotia_momentum_no_fee");
  assert.ok(noFee);
  const noFeeGrocery = getRewardRule(noFee, "groceries", "metro");
  assert.equal(noFeeGrocery.multiplier, 2);
  assert.equal(noFeeGrocery.capMonthly, 100);
  assert.equal(noFeeGrocery.capAnnual, undefined);

  const noFeeStudent = getCardById("scotia_momentum_no_fee_student");
  assert.ok(noFeeStudent);
  assert.equal(noFeeStudent.currency, "issuer rewards");
  assert.equal(getRewardRule(noFeeStudent, "groceries", "metro").multiplier, 1);
});
