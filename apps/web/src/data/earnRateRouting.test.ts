import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, CategoryUsage, RewardCategory } from "@onecard/shared-types";
import {
  categoryForDomain,
  getCardsByIds,
  recommendCard,
} from "../../../../packages/optimizer/src/index.ts";
import { applyCardRewards } from "./cardRewards.ts";

const AMOUNT = 80;

function product(cardId: string, issuer: string, displayName: string): CardProduct {
  return applyCardRewards({ cardId, issuer, displayName });
}

const td = product("td_first_class", "TD", "TD First Class Travel Visa Infinite Card");
const dividend = product("cibc_dividend", "CIBC", "CIBC Dividend Visa Card");
const wealthsimple = product(
  "ws_credit_infinite",
  "Wealthsimple",
  "Wealthsimple Visa Infinite+ Credit Card",
);
const avion = product("rbc_avion_infinite", "RBC", "RBC Avion Visa Infinite Card");

function route(
  cards: CardProduct[],
  merchant: { name: string; id?: string; mcc: string; category: RewardCategory },
  usage: CategoryUsage[] = [],
) {
  return routeTransaction({
    mode: "virtual_provisioning",
    transaction: {
      amount: AMOUNT,
      merchantName: merchant.name,
      merchantId: merchant.id,
      mcc: merchant.mcc,
      category: merchant.category,
    },
    portfolio: {
      cards,
      usage,
      preferences: { preferCashback: false },
      defaultCardId: cards[0]!.cardId,
    },
  });
}

describe("TD First Class Travel Visa Infinite earn rates", () => {
  it("pays 6x at a supermarket, ahead of the 2% CIBC Dividend Visa", () => {
    const decision = route([td, dividend], {
      name: "Metro",
      id: "metro",
      mcc: "5411",
      category: "groceries",
    });
    assert.equal(decision.selectedCardId, "td_first_class");
    // $80 * 6 points * 0.5¢ = $2.40. Dividend grocery is 2% = $1.60.
    assert.equal(decision.estimatedRewardValueCents, 240);
  });

  it("drops grocery earn to the 2-point base after $25,000 and Dividend wins", () => {
    const decision = route(
      [td, dividend],
      { name: "Metro", id: "metro", mcc: "5411", category: "groceries" },
      [{ cardId: "td_first_class", category: "groceries", spendThisPeriod: 25_000 }],
    );
    assert.equal(decision.selectedCardId, "cibc_dividend");
    const tdValue = decision.alternatives.find((card) => card.cardId === "td_first_class");
    assert.equal(tdValue?.estimatedRewardValueCents, 80);
  });

  it("does not pay the grocery bonus at Costco warehouse (MCC 5300)", () => {
    const estimate = estimateRewardForCard(
      td,
      {
        amount: AMOUNT,
        merchantName: "Costco",
        merchantId: "costco",
        mcc: "5300",
        category: "groceries",
      },
      "groceries",
      {
        cards: [td],
        usage: [],
        preferences: { preferCashback: false },
      },
    );
    assert.equal(estimate.estimatedRewardValueCents, 80);
  });

  it("pays 6x at restaurants, ahead of unlimited 2% Wealthsimple", () => {
    const decision = route([td, wealthsimple], {
      name: "Tim Hortons",
      id: "tim_hortons",
      mcc: "5814",
      category: "dining",
    });
    assert.equal(decision.selectedCardId, "td_first_class");
    assert.equal(decision.estimatedRewardValueCents, 240);
  });

  it("pays the 2-point base on an airline ticket, so Wealthsimple wins", () => {
    const decision = route([td, wealthsimple], {
      name: "Air Canada",
      id: "air_canada",
      mcc: "3000",
      category: "travel",
    });
    assert.equal(decision.selectedCardId, "ws_credit_infinite");
    assert.equal(decision.estimatedRewardValueCents, 160);
    const tdValue = decision.alternatives.find((card) => card.cardId === "td_first_class");
    assert.equal(tdValue?.estimatedRewardValueCents, 80);
  });

  it("pays 8x only on Expedia For TD, not on Expedia Inc.", () => {
    const portal = route([td, wealthsimple], {
      name: "Expedia For TD",
      id: "expedia_for_td",
      mcc: "4722",
      category: "travel",
    });
    assert.equal(portal.selectedCardId, "td_first_class");
    assert.equal(portal.estimatedRewardValueCents, 320);

    const expedia = route([td, wealthsimple], {
      name: "Expedia",
      id: "expedia",
      mcc: "4722",
      category: "travel",
    });
    assert.equal(expedia.selectedCardId, "ws_credit_infinite");
    const tdValue = expedia.alternatives.find((card) => card.cardId === "td_first_class");
    assert.equal(tdValue?.estimatedRewardValueCents, 80);
  });

  it("pays 6x on local transit (MCC 4111) and not on rideshare", () => {
    const transit = route([td, wealthsimple], {
      name: "TTC",
      id: "ttc",
      mcc: "4111",
      category: "other",
    });
    assert.equal(transit.selectedCardId, "td_first_class");
    assert.equal(transit.estimatedRewardValueCents, 240);

    const rideshare = route([td, wealthsimple], {
      name: "Uber",
      id: "uber",
      mcc: "4121",
      category: "other",
    });
    assert.equal(rideshare.selectedCardId, "ws_credit_infinite");
    const tdValue = rideshare.alternatives.find((card) => card.cardId === "td_first_class");
    assert.equal(tdValue?.estimatedRewardValueCents, 80);
  });

  it("pays 4x on a recurring bill, ahead of the 1% Dividend base", () => {
    const decision = route([td, dividend], {
      name: "Rogers",
      id: "rogers",
      mcc: "4814",
      category: "recurring_bills",
    });
    assert.equal(decision.selectedCardId, "td_first_class");
    assert.equal(decision.estimatedRewardValueCents, 160);
  });

  it("shares the $25,000 bills and streaming cap", () => {
    const usage: CategoryUsage[] = [
      {
        cardId: "td_first_class",
        category: "streaming",
        spendThisPeriod: 25_000,
        sharedCapGroup: "td_first_class_pap_media",
      },
    ];
    const bill = route(
      [td, dividend],
      { name: "Rogers", id: "rogers", mcc: "4814", category: "recurring_bills" },
      usage,
    );
    assert.equal(bill.selectedCardId, "cibc_dividend");
    const tdValue = bill.alternatives.find((card) => card.cardId === "td_first_class");
    assert.equal(tdValue?.estimatedRewardValueCents, 80);
  });

  it("pays 4x on digital games, ahead of Avion's everyday rate", () => {
    const decision = route([td, avion], {
      name: "Steam",
      id: "steam",
      mcc: "5816",
      category: "entertainment",
    });
    assert.equal(decision.selectedCardId, "td_first_class");
    // $80 * 4 * 0.5¢ = $1.60. Avion 1x at 1.4¢ = $1.12.
    assert.equal(decision.estimatedRewardValueCents, 160);
  });

  it("does not accelerate gas", () => {
    const decision = route([td, wealthsimple], {
      name: "Shell",
      id: "shell",
      mcc: "5541",
      category: "gas",
    });
    assert.equal(decision.selectedCardId, "ws_credit_infinite");
    const tdValue = decision.alternatives.find((card) => card.cardId === "td_first_class");
    assert.equal(tdValue?.estimatedRewardValueCents, 80);
  });
});

describe("checkout host mapping for TD First Class", () => {
  const extensionCards = getCardsByIds([
    "td_first_class",
    "ws_credit_infinite",
    "cibc_dividend",
    "rbc_avion_infinite",
  ]);

  it("keeps Expedia For TD distinct from Expedia Inc. and maps local transit", () => {
    assert.equal(categoryForDomain("www.expediafortd.com").merchantId, "expedia_for_td");
    assert.equal(categoryForDomain("www.expedia.ca").merchantId, "expedia");
    assert.equal(categoryForDomain("www.ttc.ca").merchantId, "ttc");
    assert.equal(categoryForDomain("www.uber.com").merchantId, "uber");
  });

  it("routes an Air Canada checkout to Wealthsimple and a Metro checkout to TD", () => {
    const flight = recommendCard({
      hostname: "www.aircanada.com",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(flight?.winner.cardId, "ws_credit_infinite");
    assert.equal(flight?.winner.estimatedRewardValueCents, 160);

    const grocery = recommendCard({
      hostname: "www.metro.ca",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(grocery?.winner.cardId, "td_first_class");
    assert.equal(grocery?.winner.estimatedRewardValueCents, 240);
  });
});
