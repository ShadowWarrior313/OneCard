import assert from "node:assert/strict";
import { test } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage } from "@onecard/shared-types";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";
import { bestCardForCategory } from "../lib/recurringBills.ts";

const GOLD = "desjardins_odyssey_gold";
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

test("Odyssey Gold Visa beats Avion on restaurants, travel, transit, entertainment, and bills", () => {
  const card = getCardById(GOLD);
  assert.ok(card);
  assert.equal(card.annualFee, 110);
  assert.equal(card.pointValueCents, 1);

  const dining = route([GOLD, AVION], "tim_hortons");
  assert.equal(dining.selectedCardId, GOLD);
  assert.equal(dining.estimatedRewardValueCents, 160);
  assert.equal(dining.estimatedRewardValueNextBestCents, 140);

  const delivery = route([GOLD, AVION], "uber_eats");
  assert.equal(delivery.selectedCardId, GOLD);
  assert.equal(delivery.estimatedRewardValueCents, 160);

  const rideshare = route([GOLD, AVION], "uber");
  assert.equal(rideshare.selectedCardId, GOLD);
  assert.equal(rideshare.estimatedRewardValueCents, 160);
  assert.equal(rideshare.estimatedRewardValueNextBestCents, 112);

  const cinema = route([GOLD, AVION], "cineplex");
  assert.equal(cinema.selectedCardId, GOLD);
  assert.equal(cinema.estimatedRewardValueCents, 160);

  const tickets = route([GOLD, AVION], "ticketmaster");
  assert.equal(tickets.selectedCardId, GOLD);

  const transit = route([GOLD, AVION], "ttc");
  assert.equal(transit.selectedCardId, GOLD);

  const sectorTransit = route([GOLD, AVION], "sector_transport");
  assert.equal(sectorTransit.selectedCardId, GOLD);

  const phone = route([GOLD, AVION], "bell");
  assert.equal(phone.selectedCardId, GOLD);
  assert.equal(phone.estimatedRewardValueCents, 160);
  assert.equal(phone.estimatedRewardValueNextBestCents, 112);

  const flight = route([GOLD, AVION], "air_canada");
  assert.equal(flight.selectedCardId, GOLD);
  assert.equal(flight.estimatedRewardValueCents, 160);
  assert.equal(flight.estimatedRewardValueNextBestCents, 140);

  const railway = route([GOLD, AVION], "via_rail");
  assert.equal(railway.selectedCardId, GOLD);
  assert.equal(railway.estimatedRewardValueCents, 160);
  assert.equal(railway.estimatedRewardValueNextBestCents, 140);
});

test("base spend stays 0.65% so Avion keeps grocery, streaming, and gaming", () => {
  const grocery = route([GOLD, AVION], "metro");
  assert.equal(grocery.selectedCardId, AVION);
  assert.equal(grocery.estimatedRewardValueNextBestCents, 52);

  const streaming = route([GOLD, AVION], "netflix");
  assert.equal(streaming.selectedCardId, AVION);
  assert.equal(streaming.estimatedRewardValueNextBestCents, 52);

  const gaming = route([GOLD, AVION], "steam");
  assert.equal(gaming.selectedCardId, AVION);
  assert.equal(gaming.estimatedRewardValueNextBestCents, 52);
});

test("restaurant, pre-authorized, and travel caps are separate", () => {
  const diningSpent: CategoryUsage[] = [
    { cardId: GOLD, category: "dining", spendThisPeriod: 6000 },
  ];
  const cappedDining = route([GOLD, AVION], "tim_hortons", 80, diningSpent);
  assert.equal(cappedDining.selectedCardId, AVION);
  assert.equal(cappedDining.estimatedRewardValueNextBestCents, 52);

  const billsStillGold = route([GOLD, AVION], "bell", 80, diningSpent);
  assert.equal(billsStillGold.selectedCardId, GOLD);
  assert.equal(billsStillGold.estimatedRewardValueCents, 160);

  const flightStillGold = route([GOLD, AVION], "air_canada", 80, diningSpent);
  assert.equal(flightStillGold.selectedCardId, GOLD);
  assert.equal(flightStillGold.estimatedRewardValueCents, 160);

  const billsSpent: CategoryUsage[] = [
    { cardId: GOLD, category: "recurring_bills", spendThisPeriod: 6000 },
  ];
  const cappedBill = route([GOLD, AVION], "hydro_one", 80, billsSpent);
  assert.equal(cappedBill.selectedCardId, AVION);
  assert.equal(cappedBill.estimatedRewardValueNextBestCents, 52);

  const diningStillGold = route([GOLD, AVION], "uber_eats", 80, billsSpent);
  assert.equal(diningStillGold.selectedCardId, GOLD);
  assert.equal(diningStillGold.estimatedRewardValueCents, 160);

  const travelSpent: CategoryUsage[] = [
    { cardId: GOLD, category: "travel", spendThisPeriod: 15000 },
  ];
  const cappedFlight = route([GOLD, AVION], "via_rail", 80, travelSpent);
  assert.equal(cappedFlight.selectedCardId, AVION);
  assert.equal(cappedFlight.estimatedRewardValueNextBestCents, 52);

  const diningAfterTravel = route([GOLD, AVION], "tim_hortons", 80, travelSpent);
  assert.equal(diningAfterTravel.selectedCardId, GOLD);
  assert.equal(diningAfterTravel.estimatedRewardValueCents, 160);

  const heavyEntertainment: CategoryUsage[] = [
    { cardId: GOLD, category: "entertainment", spendThisPeriod: 20000 },
  ];
  const cinema = route([GOLD, AVION], "amc", 80, heavyEntertainment);
  assert.equal(cinema.selectedCardId, GOLD);
  assert.equal(cinema.estimatedRewardValueCents, 160);

  const heavyTransit: CategoryUsage[] = [
    { cardId: GOLD, category: "transportation", spendThisPeriod: 20000 },
  ];
  const rideshare = route([GOLD, AVION], "lyft", 80, heavyTransit);
  assert.equal(rideshare.selectedCardId, GOLD);
  assert.equal(rideshare.estimatedRewardValueCents, 160);
});

test("bill pay routes phone and utilities to Odyssey Gold and leaves subscriptions on Avion", () => {
  const gold = getCardById(GOLD);
  const avion = getCardById(AVION);
  assert.ok(gold && avion);
  const wallet = [gold, avion];

  assert.equal(bestCardForCategory(wallet, "phone", 80)?.cardId, GOLD);
  assert.equal(bestCardForCategory(wallet, "utilities", 80)?.cardId, GOLD);
  assert.equal(bestCardForCategory(wallet, "internet", 80)?.cardId, GOLD);
  assert.equal(bestCardForCategory(wallet, "insurance", 80)?.cardId, GOLD);
  assert.equal(bestCardForCategory(wallet, "subscription", 80)?.cardId, AVION);
  assert.equal(bestCardForCategory(wallet, "rent", 80)?.cardId, AVION);
});

test("other Desjardins products stay separate 1x stubs", () => {
  for (const id of [
    "desjardins_flexi_visa",
    "desjardins_bonus_visa",
    "desjardins_cash_back_visa",
    "desjardins_cash_back_mastercard",
    "desjardins_cash_back_we",
    "desjardins_odyssey_we",
    "desjardins_odyssey_privilege",
  ]) {
    const card = getCardById(id);
    assert.ok(card, id);
    assert.deepEqual(
      card.rewards.map((rule) => rule.multiplier),
      [1],
    );
  }
});
