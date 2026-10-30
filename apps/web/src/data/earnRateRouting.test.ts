import assert from "node:assert/strict";
import { test } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage } from "@onecard/shared-types";
import { getCardById } from "./cards.ts";
import { merchantById } from "./merchants.ts";

const SCOTIA_AMEX = "scotia_amex";
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

test("Scotiabank American Express beats cards that win on the 1% stub", () => {
  const card = getCardById(SCOTIA_AMEX);
  assert.ok(card);
  assert.equal(card.annualFee, 0);
  assert.equal(card.pointValueCents, 1);
  assert.equal(card.network, "amex");
  assert.equal(card.currency, "Scene+ points");

  for (const merchantId of ["sobeys", "iga", "safeway", "freshco"]) {
    const decision = route([SCOTIA_AMEX, AVION], merchantId);
    assert.equal(decision.selectedCardId, SCOTIA_AMEX, merchantId);
    assert.equal(decision.multiplier, 3, merchantId);
    assert.equal(decision.estimatedRewardValueCents, 240, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 112, merchantId);
  }

  // Aeroplan Infinite is 1× at 2¢ on grocery ($1.60). The 1% stub loses.
  const sobeysVsAeroplan = route([SCOTIA_AMEX, AEROPLAN], "sobeys");
  assert.equal(sobeysVsAeroplan.selectedCardId, SCOTIA_AMEX);
  assert.equal(sobeysVsAeroplan.estimatedRewardValueCents, 240);
  assert.equal(sobeysVsAeroplan.estimatedRewardValueNextBestCents, 160);

  const metro = route([SCOTIA_AMEX, AVION], "metro");
  assert.equal(metro.selectedCardId, SCOTIA_AMEX);
  assert.equal(metro.multiplier, 2);
  assert.equal(metro.estimatedRewardValueCents, 160);
  assert.equal(metro.estimatedRewardValueNextBestCents, 112);

  const walmartGrocery = route([SCOTIA_AMEX, AVION], "walmart_grocery");
  assert.equal(walmartGrocery.selectedCardId, SCOTIA_AMEX);
  assert.equal(walmartGrocery.estimatedRewardValueCents, 160);
  assert.equal(walmartGrocery.estimatedRewardValueNextBestCents, 112);

  const dining = route([SCOTIA_AMEX, AVION], "tim_hortons");
  assert.equal(dining.selectedCardId, SCOTIA_AMEX);
  assert.equal(dining.estimatedRewardValueCents, 160);
  assert.equal(dining.estimatedRewardValueNextBestCents, 140);

  const delivery = route([SCOTIA_AMEX, AVION], "uber_eats");
  assert.equal(delivery.selectedCardId, SCOTIA_AMEX);
  assert.equal(delivery.estimatedRewardValueCents, 160);

  const gas = route([SCOTIA_AMEX, AVION], "shell");
  assert.equal(gas.selectedCardId, SCOTIA_AMEX);
  assert.equal(gas.estimatedRewardValueCents, 160);
  assert.equal(gas.estimatedRewardValueNextBestCents, 112);

  // Aeroplan Infinite gas is 1.5× at 2¢ ($2.40). Do not copy a flat 2× onto it.
  const gasVsAeroplan = route([SCOTIA_AMEX, AEROPLAN], "shell");
  assert.equal(gasVsAeroplan.selectedCardId, AEROPLAN);
  assert.equal(gasVsAeroplan.estimatedRewardValueCents, 240);
  assert.equal(gasVsAeroplan.estimatedRewardValueNextBestCents, 160);

  const cinema = route([SCOTIA_AMEX, AVION], "cineplex");
  assert.equal(cinema.selectedCardId, SCOTIA_AMEX);
  assert.equal(cinema.estimatedRewardValueCents, 160);
  assert.equal(cinema.estimatedRewardValueNextBestCents, 112);

  const tickets = route([SCOTIA_AMEX, AVION], "ticketmaster");
  assert.equal(tickets.selectedCardId, SCOTIA_AMEX);
  assert.equal(tickets.estimatedRewardValueCents, 160);

  const sectorCinema = route([SCOTIA_AMEX, AVION], "sector_entertainment");
  assert.equal(sectorCinema.selectedCardId, SCOTIA_AMEX);
  assert.equal(sectorCinema.estimatedRewardValueCents, 160);

  const rideshare = route([SCOTIA_AMEX, AVION], "uber");
  assert.equal(rideshare.selectedCardId, SCOTIA_AMEX);
  assert.equal(rideshare.estimatedRewardValueCents, 160);
  assert.equal(rideshare.estimatedRewardValueNextBestCents, 112);

  const transit = route([SCOTIA_AMEX, AVION], "ttc");
  assert.equal(transit.selectedCardId, SCOTIA_AMEX);
  assert.equal(transit.estimatedRewardValueCents, 160);

  const sectorTransit = route([SCOTIA_AMEX, AVION], "sector_transport");
  assert.equal(sectorTransit.selectedCardId, SCOTIA_AMEX);
  assert.equal(sectorTransit.estimatedRewardValueCents, 160);
});

test("warehouse, travel, gaming, and unpublished streaming stay off the bonus", () => {
  const card = getCardById(SCOTIA_AMEX);
  assert.ok(card);
  assert.equal(getRewardRule(card, "groceries", "sobeys").multiplier, 3);
  assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 2);
  assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
  assert.equal(getRewardRule(card, "groceries", "costco_wholesale").multiplier, 1);
  assert.equal(getRewardRule(card, "dining", "tim_hortons").capAnnual, 50000);
  assert.equal(
    getRewardRule(card, "dining", "tim_hortons").sharedCapGroup,
    "scotia_amex_accelerated",
  );
  assert.equal(getRewardRule(card, "other", "steam").multiplier, 1);
  assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 1);
  assert.equal(getRewardRule(card, "travel", "air_canada").multiplier, 1);
  assert.equal(getRewardRule(card, "travel", "via_rail").multiplier, 1);

  const flight = route([SCOTIA_AMEX, AVION], "air_canada");
  assert.equal(flight.selectedCardId, AVION);
  assert.equal(flight.estimatedRewardValueCents, 140);
  assert.equal(flight.estimatedRewardValueNextBestCents, 80);

  const railway = route([SCOTIA_AMEX, AVION], "via_rail");
  assert.equal(railway.selectedCardId, AVION);
  assert.equal(railway.estimatedRewardValueCents, 140);
  assert.equal(railway.estimatedRewardValueNextBestCents, 80);

  const gaming = route([SCOTIA_AMEX, AEROPLAN], "steam");
  assert.equal(gaming.selectedCardId, AEROPLAN);
  assert.equal(gaming.estimatedRewardValueCents, 160);
  assert.equal(gaming.estimatedRewardValueNextBestCents, 80);

  for (const merchantId of ["xbox", "playstation", "ea"]) {
    const decision = route([SCOTIA_AMEX, AEROPLAN], merchantId);
    assert.equal(decision.selectedCardId, AEROPLAN, merchantId);
    assert.equal(decision.estimatedRewardValueNextBestCents, 80, merchantId);
  }

  const streaming = route([SCOTIA_AMEX, AVION], "netflix");
  assert.equal(streaming.selectedCardId, AVION);
  assert.equal(streaming.estimatedRewardValueCents, 112);
  assert.equal(streaming.estimatedRewardValueNextBestCents, 80);

  // Loblaws banners do not accept Amex, so the grocery bonus must not be selected.
  const loblaws = route([SCOTIA_AMEX, AVION], "loblaws");
  assert.equal(loblaws.selectedCardId, AVION);
});

test("the $50,000 accelerated cap is shared, then the card falls back to 1 Scene+", () => {
  const spent: CategoryUsage[] = [
    {
      cardId: SCOTIA_AMEX,
      category: "dining",
      spendThisPeriod: 50000,
      sharedCapGroup: "scotia_amex_accelerated",
    },
  ];

  const metro = route([SCOTIA_AMEX, AVION], "metro", 80, spent);
  assert.equal(metro.selectedCardId, AVION);
  assert.equal(metro.estimatedRewardValueCents, 112);
  assert.equal(metro.estimatedRewardValueNextBestCents, 80);

  const dining = route([SCOTIA_AMEX, AVION], "tim_hortons", 80, spent);
  assert.equal(dining.selectedCardId, AVION);
  assert.equal(dining.estimatedRewardValueCents, 140);
  assert.equal(dining.estimatedRewardValueNextBestCents, 80);

  const gas = route([SCOTIA_AMEX, AVION], "shell", 80, spent);
  assert.equal(gas.selectedCardId, AVION);
  assert.equal(gas.estimatedRewardValueCents, 112);
  assert.equal(gas.estimatedRewardValueNextBestCents, 80);

  const uncapped = route([SCOTIA_AMEX, AVION], "tim_hortons");
  assert.equal(uncapped.selectedCardId, SCOTIA_AMEX);
  assert.equal(uncapped.estimatedRewardValueCents, 160);
});

test("sibling Scotia cards keep their own earn models", () => {
  const gold = getCardById("scotia_gold_amex");
  assert.ok(gold);
  assert.equal(getRewardRule(gold, "dining", "tim_hortons").multiplier, 5);
  assert.equal(getRewardRule(gold, "groceries", "sobeys").multiplier, 3);
  assert.notEqual(gold.currency, "issuer rewards");

  const platinum = getCardById("scotia_platinum_amex");
  assert.ok(platinum);
  assert.equal(platinum.currency, "issuer rewards");
  assert.equal(getRewardRule(platinum, "other", "sobeys").multiplier, 1);
  assert.equal(platinum.annualFee, undefined);

  const momentum = getCardById("scotia_momentum_visa");
  assert.ok(momentum);
  assert.equal(momentum.currency, "issuer rewards");
  assert.equal(getRewardRule(momentum, "groceries", "metro").multiplier, 1);
});
