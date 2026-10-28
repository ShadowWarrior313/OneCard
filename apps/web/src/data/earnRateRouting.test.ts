import assert from "node:assert/strict";
import { test } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage } from "@onecard/shared-types";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";
import { bestCardForCategory } from "../lib/recurringBills.ts";

const WE = "desjardins_odyssey_we";
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

test("Odyssey World Elite beats Avion on groceries, restaurants, travel, transit, and entertainment", () => {
  const card = getCardById(WE);
  assert.ok(card);
  assert.equal(card.annualFee, 130);
  assert.equal(card.pointValueCents, 1);
  assert.equal(card.network, "mastercard");

  const grocery = route([WE, AVION], "metro");
  assert.equal(grocery.selectedCardId, WE);
  assert.equal(grocery.estimatedRewardValueCents, 240);
  assert.equal(grocery.estimatedRewardValueNextBestCents, 112);

  const loblaws = route([WE, AVION], "loblaws");
  assert.equal(loblaws.selectedCardId, WE);
  assert.equal(loblaws.estimatedRewardValueCents, 240);

  const walmartGrocery = route([WE, AVION], "walmart_grocery");
  assert.equal(walmartGrocery.selectedCardId, WE);
  assert.equal(walmartGrocery.estimatedRewardValueCents, 240);

  const dining = route([WE, AVION], "tim_hortons");
  assert.equal(dining.selectedCardId, WE);
  assert.equal(dining.estimatedRewardValueCents, 240);
  assert.equal(dining.estimatedRewardValueNextBestCents, 140);

  const delivery = route([WE, AVION], "uber_eats");
  assert.equal(delivery.selectedCardId, WE);
  assert.equal(delivery.estimatedRewardValueCents, 240);

  const rideshare = route([WE, AVION], "uber");
  assert.equal(rideshare.selectedCardId, WE);
  assert.equal(rideshare.estimatedRewardValueCents, 160);
  assert.equal(rideshare.estimatedRewardValueNextBestCents, 112);

  const cinema = route([WE, AVION], "cineplex");
  assert.equal(cinema.selectedCardId, WE);
  assert.equal(cinema.estimatedRewardValueCents, 160);
  assert.equal(cinema.estimatedRewardValueNextBestCents, 112);

  const tickets = route([WE, AVION], "ticketmaster");
  assert.equal(tickets.selectedCardId, WE);
  assert.equal(tickets.estimatedRewardValueCents, 160);

  const transit = route([WE, AVION], "ttc");
  assert.equal(transit.selectedCardId, WE);
  assert.equal(transit.estimatedRewardValueCents, 160);

  const sectorTransit = route([WE, AVION], "sector_transport");
  assert.equal(sectorTransit.selectedCardId, WE);
  assert.equal(sectorTransit.estimatedRewardValueCents, 160);

  const flight = route([WE, AVION], "air_canada");
  assert.equal(flight.selectedCardId, WE);
  assert.equal(flight.estimatedRewardValueCents, 160);
  assert.equal(flight.estimatedRewardValueNextBestCents, 140);

  const railway = route([WE, AVION], "via_rail");
  assert.equal(railway.selectedCardId, WE);
  assert.equal(railway.estimatedRewardValueCents, 160);
  assert.equal(railway.estimatedRewardValueNextBestCents, 140);
});

test("warehouse clubs, base spend, and pre-authorized payments stay at 1%", () => {
  const costco = route([WE, AVION], "costco");
  assert.equal(costco.selectedCardId, WE);
  assert.equal(costco.multiplier, 1);
  assert.equal(costco.estimatedRewardValueCents, 80);

  const wholesale = route([WE], "costco_wholesale");
  assert.equal(wholesale.multiplier, 1);
  assert.equal(wholesale.estimatedRewardValueCents, 80);

  const streaming = route([WE, AVION], "netflix");
  assert.equal(streaming.selectedCardId, AVION);
  assert.equal(streaming.estimatedRewardValueNextBestCents, 80);

  const gaming = route([WE, AVION], "steam");
  assert.equal(gaming.selectedCardId, AVION);
  assert.equal(gaming.estimatedRewardValueNextBestCents, 80);

  const xbox = route([WE, AVION], "xbox");
  assert.equal(xbox.selectedCardId, AVION);

  const phone = route([WE, AVION], "bell");
  assert.equal(phone.selectedCardId, AVION);
  assert.equal(phone.estimatedRewardValueCents, 112);
  assert.equal(phone.estimatedRewardValueNextBestCents, 80);
});

test("grocery, restaurant, and travel caps are separate and entertainment is uncapped", () => {
  const diningSpent: CategoryUsage[] = [
    { cardId: WE, category: "dining", spendThisPeriod: 6000 },
  ];
  const cappedDining = route([WE, AVION], "tim_hortons", 80, diningSpent);
  assert.equal(cappedDining.selectedCardId, AVION);
  assert.equal(cappedDining.estimatedRewardValueNextBestCents, 80);

  const groceryStillWe = route([WE, AVION], "metro", 80, diningSpent);
  assert.equal(groceryStillWe.selectedCardId, WE);
  assert.equal(groceryStillWe.estimatedRewardValueCents, 240);

  const flightStillWe = route([WE, AVION], "air_canada", 80, diningSpent);
  assert.equal(flightStillWe.selectedCardId, WE);
  assert.equal(flightStillWe.estimatedRewardValueCents, 160);

  const grocerySpent: CategoryUsage[] = [
    { cardId: WE, category: "groceries", spendThisPeriod: 10000 },
  ];
  const cappedGrocery = route([WE, AVION], "metro", 80, grocerySpent);
  assert.equal(cappedGrocery.selectedCardId, AVION);
  assert.equal(cappedGrocery.estimatedRewardValueNextBestCents, 80);

  const diningStillWe = route([WE, AVION], "uber_eats", 80, grocerySpent);
  assert.equal(diningStillWe.selectedCardId, WE);
  assert.equal(diningStillWe.estimatedRewardValueCents, 240);

  const travelSpent: CategoryUsage[] = [
    { cardId: WE, category: "travel", spendThisPeriod: 20000 },
  ];
  const cappedFlight = route([WE, AVION], "via_rail", 80, travelSpent);
  assert.equal(cappedFlight.selectedCardId, AVION);
  assert.equal(cappedFlight.estimatedRewardValueNextBestCents, 80);

  const diningAfterTravel = route([WE, AVION], "tim_hortons", 80, travelSpent);
  assert.equal(diningAfterTravel.selectedCardId, WE);
  assert.equal(diningAfterTravel.estimatedRewardValueCents, 240);

  const heavyEntertainment: CategoryUsage[] = [
    { cardId: WE, category: "entertainment", spendThisPeriod: 20000 },
  ];
  const cinema = route([WE, AVION], "amc", 80, heavyEntertainment);
  assert.equal(cinema.selectedCardId, WE);
  assert.equal(cinema.estimatedRewardValueCents, 160);

  const heavyTransit: CategoryUsage[] = [
    { cardId: WE, category: "transportation", spendThisPeriod: 20000 },
  ];
  const rideshare = route([WE, AVION], "lyft", 80, heavyTransit);
  assert.equal(rideshare.selectedCardId, WE);
  assert.equal(rideshare.estimatedRewardValueCents, 160);
});

test("bill pay leaves phone, utilities, and subscriptions on Avion", () => {
  const we = getCardById(WE);
  const avion = getCardById(AVION);
  assert.ok(we && avion);
  const wallet = [we, avion];

  assert.equal(bestCardForCategory(wallet, "phone", 80)?.cardId, AVION);
  assert.equal(bestCardForCategory(wallet, "utilities", 80)?.cardId, AVION);
  assert.equal(bestCardForCategory(wallet, "internet", 80)?.cardId, AVION);
  assert.equal(bestCardForCategory(wallet, "insurance", 80)?.cardId, AVION);
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
    "desjardins_odyssey_gold",
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
