import assert from "node:assert/strict";
import { test } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage } from "@onecard/shared-types";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";
import { bestCardForCategory } from "../lib/recurringBills.ts";

const VISA = "desjardins_cash_back_visa";
const MASTERCARD = "desjardins_cash_back_mastercard";
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

test("Desjardins Cash Back beats Avion on restaurants, transit, entertainment, and bills", () => {
  for (const cardId of [VISA, MASTERCARD]) {
    const dining = route([cardId, AVION], "tim_hortons");
    assert.equal(dining.selectedCardId, cardId);
    assert.equal(dining.estimatedRewardValueCents, 160);
    assert.equal(dining.estimatedRewardValueNextBestCents, 140);

    const rideshare = route([cardId, AVION], "uber");
    assert.equal(rideshare.selectedCardId, cardId);
    assert.equal(rideshare.estimatedRewardValueCents, 160);
    assert.equal(rideshare.estimatedRewardValueNextBestCents, 112);

    const cinema = route([cardId, AVION], "cineplex");
    assert.equal(cinema.selectedCardId, cardId);
    assert.equal(cinema.estimatedRewardValueCents, 160);

    const tickets = route([cardId, AVION], "ticketmaster");
    assert.equal(tickets.selectedCardId, cardId);

    const transit = route([cardId, AVION], "ttc");
    assert.equal(transit.selectedCardId, cardId);

    const sectorTransit = route([cardId, AVION], "sector_transport");
    assert.equal(sectorTransit.selectedCardId, cardId);

    const phone = route([cardId, AVION], "bell");
    assert.equal(phone.selectedCardId, cardId);
    assert.equal(phone.estimatedRewardValueCents, 160);
    assert.equal(phone.estimatedRewardValueNextBestCents, 112);
  }
});

test("base spend stays 0.5% so Avion keeps grocery, travel, streaming, and gaming", () => {
  const grocery = route([VISA, AVION], "metro");
  assert.equal(grocery.selectedCardId, AVION);
  assert.equal(grocery.estimatedRewardValueNextBestCents, 40);

  const railway = route([VISA, AVION], "via_rail");
  assert.equal(railway.selectedCardId, AVION);
  assert.equal(railway.estimatedRewardValueCents, 140);

  const streaming = route([VISA, AVION], "netflix");
  assert.equal(streaming.selectedCardId, AVION);
  assert.equal(streaming.estimatedRewardValueNextBestCents, 40);

  const gaming = route([VISA, AVION], "steam");
  assert.equal(gaming.selectedCardId, AVION);
  assert.equal(gaming.estimatedRewardValueNextBestCents, 40);

  const airline = route([VISA, AVION], "air_canada");
  assert.equal(airline.selectedCardId, AVION);
});

test("restaurant and pre-authorized caps are separate $3,600 limits", () => {
  const diningSpent: CategoryUsage[] = [
    { cardId: VISA, category: "dining", spendThisPeriod: 3600 },
  ];
  const cappedDining = route([VISA, AVION], "tim_hortons", 80, diningSpent);
  assert.equal(cappedDining.selectedCardId, AVION);
  assert.equal(cappedDining.estimatedRewardValueNextBestCents, 40);

  const billsStillBonus = route([VISA, AVION], "bell", 80, diningSpent);
  assert.equal(billsStillBonus.selectedCardId, VISA);
  assert.equal(billsStillBonus.estimatedRewardValueCents, 160);

  const billsSpent: CategoryUsage[] = [
    { cardId: VISA, category: "recurring_bills", spendThisPeriod: 3600 },
  ];
  const cappedBill = route([VISA, AVION], "hydro_one", 80, billsSpent);
  assert.equal(cappedBill.selectedCardId, AVION);
  assert.equal(cappedBill.estimatedRewardValueNextBestCents, 40);

  const diningStillBonus = route([VISA, AVION], "uber_eats", 80, billsSpent);
  assert.equal(diningStillBonus.selectedCardId, VISA);
  assert.equal(diningStillBonus.estimatedRewardValueCents, 160);

  const heavyEntertainment: CategoryUsage[] = [
    { cardId: VISA, category: "entertainment", spendThisPeriod: 5000 },
  ];
  const cinema = route([VISA, AVION], "amc", 80, heavyEntertainment);
  assert.equal(cinema.selectedCardId, VISA);
  assert.equal(cinema.estimatedRewardValueCents, 160);
});

test("bill pay routes phone and utilities to Desjardins and leaves subscriptions on Avion", () => {
  const visa = getCardById(VISA);
  const avion = getCardById(AVION);
  assert.ok(visa && avion);
  const wallet = [visa, avion];

  assert.equal(bestCardForCategory(wallet, "phone", 80)?.cardId, VISA);
  assert.equal(bestCardForCategory(wallet, "utilities", 80)?.cardId, VISA);
  assert.equal(bestCardForCategory(wallet, "internet", 80)?.cardId, VISA);
  assert.equal(bestCardForCategory(wallet, "subscription", 80)?.cardId, AVION);
  assert.equal(bestCardForCategory(wallet, "rent", 80)?.cardId, AVION);
});

test("Cash Back World Elite stays a separate 1x product", () => {
  const elite = getCardById("desjardins_cash_back_we");
  assert.ok(elite);
  assert.deepEqual(
    elite.rewards.map((rule) => rule.multiplier),
    [1],
  );
});
