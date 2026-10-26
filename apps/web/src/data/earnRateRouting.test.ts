import assert from "node:assert/strict";
import { test } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage } from "@onecard/shared-types";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";
import { bestCardForCategory } from "../lib/recurringBills.ts";

const BONUS = "desjardins_bonus_visa";
const AVION = "rbc_avion_infinite";

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

test("Desjardins Bonus Visa beats Avion on restaurants, transit, entertainment, and bills", () => {
  const dining = route([BONUS, AVION], "tim_hortons");
  assert.equal(dining.selectedCardId, BONUS);
  assert.equal(dining.estimatedRewardValueCents, 160);
  assert.equal(dining.estimatedRewardValueNextBestCents, 140);

  const delivery = route([BONUS, AVION], "uber_eats");
  assert.equal(delivery.selectedCardId, BONUS);
  assert.equal(delivery.estimatedRewardValueCents, 160);

  const rideshare = route([BONUS, AVION], "uber");
  assert.equal(rideshare.selectedCardId, BONUS);
  assert.equal(rideshare.estimatedRewardValueCents, 160);
  assert.equal(rideshare.estimatedRewardValueNextBestCents, 112);

  const cinema = route([BONUS, AVION], "cineplex");
  assert.equal(cinema.selectedCardId, BONUS);
  assert.equal(cinema.estimatedRewardValueCents, 160);

  const tickets = route([BONUS, AVION], "ticketmaster");
  assert.equal(tickets.selectedCardId, BONUS);

  const transit = route([BONUS, AVION], "ttc");
  assert.equal(transit.selectedCardId, BONUS);

  const sectorTransit = route([BONUS, AVION], "sector_transport");
  assert.equal(sectorTransit.selectedCardId, BONUS);

  const phone = route([BONUS, AVION], "bell");
  assert.equal(phone.selectedCardId, BONUS);
  assert.equal(phone.estimatedRewardValueCents, 160);
  assert.equal(phone.estimatedRewardValueNextBestCents, 112);
});

test("base spend stays 0.5% so Avion keeps grocery, travel, streaming, and gaming", () => {
  const grocery = route([BONUS, AVION], "metro");
  assert.equal(grocery.selectedCardId, AVION);
  assert.equal(grocery.estimatedRewardValueNextBestCents, 40);

  const railway = route([BONUS, AVION], "via_rail");
  assert.equal(railway.selectedCardId, AVION);
  assert.equal(railway.estimatedRewardValueCents, 140);

  const streaming = route([BONUS, AVION], "netflix");
  assert.equal(streaming.selectedCardId, AVION);
  assert.equal(streaming.estimatedRewardValueNextBestCents, 40);

  const gaming = route([BONUS, AVION], "steam");
  assert.equal(gaming.selectedCardId, AVION);
  assert.equal(gaming.estimatedRewardValueNextBestCents, 40);

  const airline = route([BONUS, AVION], "air_canada");
  assert.equal(airline.selectedCardId, AVION);
});

test("restaurant and pre-authorized caps are separate $3,600 limits", () => {
  const diningSpent: CategoryUsage[] = [
    { cardId: BONUS, category: "dining", spendThisPeriod: 3600 },
  ];
  const cappedDining = route([BONUS, AVION], "tim_hortons", 80, diningSpent);
  assert.equal(cappedDining.selectedCardId, AVION);
  assert.equal(cappedDining.estimatedRewardValueNextBestCents, 40);

  const billsStillBonus = route([BONUS, AVION], "bell", 80, diningSpent);
  assert.equal(billsStillBonus.selectedCardId, BONUS);
  assert.equal(billsStillBonus.estimatedRewardValueCents, 160);

  const billsSpent: CategoryUsage[] = [
    { cardId: BONUS, category: "recurring_bills", spendThisPeriod: 3600 },
  ];
  const cappedBill = route([BONUS, AVION], "hydro_one", 80, billsSpent);
  assert.equal(cappedBill.selectedCardId, AVION);
  assert.equal(cappedBill.estimatedRewardValueNextBestCents, 40);

  const diningStillBonus = route([BONUS, AVION], "uber_eats", 80, billsSpent);
  assert.equal(diningStillBonus.selectedCardId, BONUS);
  assert.equal(diningStillBonus.estimatedRewardValueCents, 160);

  const heavyEntertainment: CategoryUsage[] = [
    { cardId: BONUS, category: "entertainment", spendThisPeriod: 5000 },
  ];
  const cinema = route([BONUS, AVION], "amc", 80, heavyEntertainment);
  assert.equal(cinema.selectedCardId, BONUS);
  assert.equal(cinema.estimatedRewardValueCents, 160);
});

test("bill pay routes phone and utilities to Bonus Visa and leaves subscriptions on Avion", () => {
  const bonus = getCardById(BONUS);
  const avion = getCardById(AVION);
  assert.ok(bonus && avion);
  const wallet = [bonus, avion];

  assert.equal(bestCardForCategory(wallet, "phone", 80)?.cardId, BONUS);
  assert.equal(bestCardForCategory(wallet, "utilities", 80)?.cardId, BONUS);
  assert.equal(bestCardForCategory(wallet, "internet", 80)?.cardId, BONUS);
  assert.equal(bestCardForCategory(wallet, "insurance", 80)?.cardId, BONUS);
  assert.equal(bestCardForCategory(wallet, "subscription", 80)?.cardId, AVION);
  assert.equal(bestCardForCategory(wallet, "rent", 80)?.cardId, AVION);
});

test("Flexi Visa and Odyssey Gold stay separate 1x products", () => {
  for (const id of ["desjardins_flexi_visa", "desjardins_odyssey_gold"]) {
    const card = getCardById(id);
    assert.ok(card, id);
    assert.deepEqual(
      card.rewards.map((rule) => rule.multiplier),
      [1],
    );
  }
});
