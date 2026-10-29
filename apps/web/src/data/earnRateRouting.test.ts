import assert from "node:assert/strict";
import { test } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage } from "@onecard/shared-types";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";

const PRIVILEGE = "desjardins_odyssey_privilege";
const AVION = "rbc_avion_infinite";
const SCENE = "scotia_scene";
const AEROPLAN = "cibc_aeroplan_infinite";
const COBALT = "amex_cobalt";

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

test("Odyssey Privilege beats cards that win on the 1% stub and on a 1.5% base", () => {
  const card = getCardById(PRIVILEGE);
  assert.ok(card);
  assert.equal(card.annualFee, 295);
  assert.equal(card.pointValueCents, 1);
  assert.equal(card.network, "visa");
  assert.equal(card.currency, "BONUSDOLLARS");

  const metro = route([PRIVILEGE, AVION], "metro");
  assert.equal(metro.selectedCardId, PRIVILEGE);
  assert.equal(metro.estimatedRewardValueCents, 240);
  assert.equal(metro.estimatedRewardValueNextBestCents, 112);

  const loblaws = route([PRIVILEGE, AVION], "loblaws");
  assert.equal(loblaws.selectedCardId, PRIVILEGE);
  assert.equal(loblaws.estimatedRewardValueCents, 240);

  const walmartGrocery = route([PRIVILEGE, AVION], "walmart_grocery");
  assert.equal(walmartGrocery.selectedCardId, PRIVILEGE);
  assert.equal(walmartGrocery.estimatedRewardValueCents, 240);

  const dining = route([PRIVILEGE, AVION], "tim_hortons");
  assert.equal(dining.selectedCardId, PRIVILEGE);
  assert.equal(dining.estimatedRewardValueCents, 320);
  assert.equal(dining.estimatedRewardValueNextBestCents, 140);

  const delivery = route([PRIVILEGE, AVION], "uber_eats");
  assert.equal(delivery.selectedCardId, PRIVILEGE);
  assert.equal(delivery.estimatedRewardValueCents, 320);

  const flight = route([PRIVILEGE, AVION], "air_canada");
  assert.equal(flight.selectedCardId, PRIVILEGE);
  assert.equal(flight.estimatedRewardValueCents, 240);
  assert.equal(flight.estimatedRewardValueNextBestCents, 140);

  const railway = route([PRIVILEGE, AVION], "via_rail");
  assert.equal(railway.selectedCardId, PRIVILEGE);
  assert.equal(railway.multiplier, 3);
  assert.equal(railway.estimatedRewardValueCents, 240);
  assert.equal(railway.estimatedRewardValueNextBestCents, 140);

  // Scene+ is an explicit 2% Cineplex rule. A 1.5% base still loses ($1.20 vs $1.60).
  const cinema = route([PRIVILEGE, SCENE], "cineplex");
  assert.equal(cinema.selectedCardId, PRIVILEGE);
  assert.equal(cinema.estimatedRewardValueCents, 320);
  assert.equal(cinema.estimatedRewardValueNextBestCents, 160);

  const cinemaVsCobalt = route([PRIVILEGE, COBALT], "cineplex");
  assert.equal(cinemaVsCobalt.selectedCardId, PRIVILEGE);
  assert.equal(cinemaVsCobalt.estimatedRewardValueCents, 320);
  assert.equal(cinemaVsCobalt.estimatedRewardValueNextBestCents, 160);

  const tickets = route([PRIVILEGE, SCENE], "ticketmaster");
  assert.equal(tickets.selectedCardId, PRIVILEGE);
  assert.equal(tickets.estimatedRewardValueCents, 320);

  const sectorCinema = route([PRIVILEGE, AVION], "sector_entertainment");
  assert.equal(sectorCinema.selectedCardId, PRIVILEGE);
  assert.equal(sectorCinema.estimatedRewardValueCents, 320);
  assert.equal(sectorCinema.estimatedRewardValueNextBestCents, 112);

  // Aeroplan Infinite is 1× at 2¢ ($1.60). That beats a 1% stub and a 1.5% base.
  const rideshare = route([PRIVILEGE, AEROPLAN], "uber");
  assert.equal(rideshare.selectedCardId, PRIVILEGE);
  assert.equal(rideshare.estimatedRewardValueCents, 320);
  assert.equal(rideshare.estimatedRewardValueNextBestCents, 160);

  const rideshareVsAvion = route([PRIVILEGE, AVION], "uber");
  assert.equal(rideshareVsAvion.selectedCardId, PRIVILEGE);
  assert.equal(rideshareVsAvion.estimatedRewardValueCents, 320);
  assert.equal(rideshareVsAvion.estimatedRewardValueNextBestCents, 112);

  const lyft = route([PRIVILEGE, COBALT], "lyft");
  assert.equal(lyft.selectedCardId, PRIVILEGE);
  assert.equal(lyft.estimatedRewardValueCents, 320);

  const transit = route([PRIVILEGE, AEROPLAN], "ttc");
  assert.equal(transit.selectedCardId, PRIVILEGE);
  assert.equal(transit.estimatedRewardValueCents, 320);
  assert.equal(transit.estimatedRewardValueNextBestCents, 160);

  const sectorTransit = route([PRIVILEGE, AVION], "sector_transport");
  assert.equal(sectorTransit.selectedCardId, PRIVILEGE);
  assert.equal(sectorTransit.estimatedRewardValueCents, 320);
});

test("warehouse clubs, gaming, and streaming do not earn the 4% entertainment rate", () => {
  const card = getCardById(PRIVILEGE);
  assert.ok(card);
  assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 3);
  assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1.5);
  assert.equal(getRewardRule(card, "groceries", "costco_wholesale").multiplier, 1.5);
  assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 4);
  assert.equal(getRewardRule(card, "travel", "air_canada").capAnnual, 25000);
  assert.equal(getRewardRule(card, "entertainment", "cineplex").multiplier, 4);
  assert.equal(getRewardRule(card, "other", "steam").multiplier, 1.5);

  const gaming = route([PRIVILEGE, AEROPLAN], "steam");
  assert.equal(gaming.selectedCardId, AEROPLAN);
  assert.equal(gaming.estimatedRewardValueCents, 160);
  assert.equal(gaming.estimatedRewardValueNextBestCents, 120);

  for (const merchantId of ["xbox", "playstation", "ea"]) {
    const decision = route([PRIVILEGE, AEROPLAN], merchantId);
    assert.equal(decision.selectedCardId, AEROPLAN, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 120, merchantId);
  }

  const streaming = route([PRIVILEGE, AVION], "netflix");
  assert.equal(streaming.selectedCardId, PRIVILEGE);
  assert.equal(streaming.multiplier, 1.5);
  assert.equal(streaming.estimatedRewardValueCents, 120);
  assert.equal(streaming.estimatedRewardValueNextBestCents, 112);

  const phone = route([PRIVILEGE, AVION], "bell");
  assert.equal(phone.selectedCardId, PRIVILEGE);
  assert.equal(phone.multiplier, 1.5);
  assert.equal(phone.estimatedRewardValueCents, 120);
  assert.equal(phone.estimatedRewardValueNextBestCents, 112);
});

test("only travel is capped, and entertainment stays 4% with no annual cap", () => {
  const heavyDining: CategoryUsage[] = [
    { cardId: PRIVILEGE, category: "dining", spendThisPeriod: 6000 },
  ];
  const dining = route([PRIVILEGE, AVION], "tim_hortons", 80, heavyDining);
  assert.equal(dining.selectedCardId, PRIVILEGE);
  assert.equal(dining.estimatedRewardValueCents, 320);

  const heavyGrocery: CategoryUsage[] = [
    { cardId: PRIVILEGE, category: "groceries", spendThisPeriod: 10000 },
  ];
  const grocery = route([PRIVILEGE, AVION], "metro", 80, heavyGrocery);
  assert.equal(grocery.selectedCardId, PRIVILEGE);
  assert.equal(grocery.estimatedRewardValueCents, 240);

  const travelSpent: CategoryUsage[] = [
    { cardId: PRIVILEGE, category: "travel", spendThisPeriod: 25000 },
  ];
  const cappedFlight = route([PRIVILEGE, AVION], "air_canada", 80, travelSpent);
  assert.equal(cappedFlight.selectedCardId, AVION);
  assert.equal(cappedFlight.estimatedRewardValueCents, 140);
  assert.equal(cappedFlight.estimatedRewardValueNextBestCents, 120);

  const cappedRailway = route([PRIVILEGE, AVION], "via_rail", 80, travelSpent);
  assert.equal(cappedRailway.selectedCardId, AVION);
  assert.equal(cappedRailway.estimatedRewardValueNextBestCents, 120);

  const diningAfterTravel = route([PRIVILEGE, AVION], "tim_hortons", 80, travelSpent);
  assert.equal(diningAfterTravel.selectedCardId, PRIVILEGE);
  assert.equal(diningAfterTravel.estimatedRewardValueCents, 320);

  const transitAfterTravel = route([PRIVILEGE, AEROPLAN], "uber", 80, travelSpent);
  assert.equal(transitAfterTravel.selectedCardId, PRIVILEGE);
  assert.equal(transitAfterTravel.estimatedRewardValueCents, 320);

  const heavyEntertainment: CategoryUsage[] = [
    { cardId: PRIVILEGE, category: "entertainment", spendThisPeriod: 25000 },
  ];
  const cinema = route([PRIVILEGE, SCENE], "amc", 80, heavyEntertainment);
  assert.equal(cinema.selectedCardId, PRIVILEGE);
  assert.equal(cinema.estimatedRewardValueCents, 320);

  const heavyTransit: CategoryUsage[] = [
    { cardId: PRIVILEGE, category: "transportation", spendThisPeriod: 25000 },
  ];
  const rideshare = route([PRIVILEGE, AEROPLAN], "lyft", 80, heavyTransit);
  assert.equal(rideshare.selectedCardId, PRIVILEGE);
  assert.equal(rideshare.estimatedRewardValueCents, 320);
});

test("other Desjardins products stay separate 1x stubs", () => {
  for (const id of [
    "desjardins_flexi_visa",
    "desjardins_bonus_visa",
    "desjardins_cash_back_visa",
    "desjardins_cash_back_mastercard",
    "desjardins_cash_back_we",
    "desjardins_odyssey_gold",
    "desjardins_odyssey_we",
  ]) {
    const card = getCardById(id);
    assert.ok(card, id);
    assert.deepEqual(
      card.rewards.map((rule) => rule.multiplier),
      [1],
    );
  }
});
