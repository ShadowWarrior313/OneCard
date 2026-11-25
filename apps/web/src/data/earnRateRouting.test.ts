import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, CategoryUsage, RewardCategory } from "@onecard/shared-types";
import { getCardsByIds, recommendCard } from "../../../../packages/optimizer/src/index.ts";
import { applyCardRewards } from "./cardRewards.ts";

const AMOUNT = 80;
const CAP_GROUP = "amex_simplycash_preferred_gas_grocery";

function product(cardId: string, issuer: string, displayName: string): CardProduct {
  return applyCardRewards({ cardId, issuer, displayName });
}

const simplyCash = product(
  "amex_simplycash_preferred",
  "American Express",
  "SimplyCash Preferred Card",
);
const dividendPlatinum = product(
  "cibc_dividend_platinum",
  "CIBC",
  "CIBC Dividend Platinum Visa Card",
);
const wealthsimple = product(
  "ws_credit_infinite",
  "Wealthsimple",
  "Wealthsimple Visa Infinite+ Credit Card",
);

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

describe("SimplyCash Preferred earn rates", () => {
  it("pays 4% at a stand-alone grocer, ahead of Dividend Platinum's 3%", () => {
    const decision = route([simplyCash, dividendPlatinum], {
      name: "Metro",
      id: "metro",
      mcc: "5411",
      category: "groceries",
    });
    assert.equal(decision.selectedCardId, "amex_simplycash_preferred");
    // $80 * 4% = $3.20. Dividend Platinum groceries are 3% = $2.40.
    assert.equal(decision.estimatedRewardValueCents, 320);
  });

  it("pays 4% at a stand-alone gas station, ahead of Dividend Platinum's 3%", () => {
    const decision = route([simplyCash, dividendPlatinum], {
      name: "Shell",
      id: "shell",
      mcc: "5541",
      category: "gas",
    });
    assert.equal(decision.selectedCardId, "amex_simplycash_preferred");
    assert.equal(decision.estimatedRewardValueCents, 320);
  });

  it("keeps the 4% grocery rate after $300 of spend (the old monthly cap)", () => {
    const decision = route(
      [simplyCash, dividendPlatinum],
      { name: "Metro", id: "metro", mcc: "5411", category: "groceries" },
      [
        {
          cardId: "amex_simplycash_preferred",
          category: "groceries",
          spendThisPeriod: 300,
          sharedCapGroup: CAP_GROUP,
        },
      ],
    );
    assert.equal(decision.selectedCardId, "amex_simplycash_preferred");
    assert.equal(decision.estimatedRewardValueCents, 320);
  });

  it("drops grocery and gas to 2% after the shared $30,000 annual cap", () => {
    const usage: CategoryUsage[] = [
      {
        cardId: "amex_simplycash_preferred",
        category: "gas",
        spendThisPeriod: 30_000,
        sharedCapGroup: CAP_GROUP,
      },
    ];
    const grocery = route(
      [simplyCash, dividendPlatinum],
      { name: "Metro", id: "metro", mcc: "5411", category: "groceries" },
      usage,
    );
    assert.equal(grocery.selectedCardId, "cibc_dividend_platinum");
    const groceryValue = grocery.alternatives.find(
      (card) => card.cardId === "amex_simplycash_preferred",
    );
    assert.equal(groceryValue?.estimatedRewardValueCents, 160);

    const gas = route(
      [simplyCash, dividendPlatinum],
      { name: "Shell", id: "shell", mcc: "5541", category: "gas" },
      usage,
    );
    assert.equal(gas.selectedCardId, "cibc_dividend_platinum");
    const gasValue = gas.alternatives.find(
      (card) => card.cardId === "amex_simplycash_preferred",
    );
    assert.equal(gasValue?.estimatedRewardValueCents, 160);
  });

  it("pays the 2% base at superstores, wholesale clubs, and grocery delivery", () => {
    const portfolio = {
      cards: [simplyCash],
      usage: [],
      preferences: { preferCashback: false },
    };
    for (const merchant of [
      { name: "Walmart", id: "walmart_grocery" },
      { name: "Costco", id: "costco" },
      { name: "Real Canadian Superstore", id: "superstore" },
      { name: "Instacart", id: "instacart" },
    ]) {
      const estimate = estimateRewardForCard(
        simplyCash,
        {
          amount: AMOUNT,
          merchantName: merchant.name,
          merchantId: merchant.id,
          mcc: "5411",
          category: "groceries",
        },
        "groceries",
        portfolio,
      );
      assert.equal(estimate.estimatedRewardValueCents, 160, merchant.id);
    }
  });

  it("pays 2% on everyday spend, tying unlimited 2% Wealthsimple", () => {
    const decision = route([simplyCash, wealthsimple], {
      name: "Amazon",
      id: "amazon",
      mcc: "5399",
      category: "retail",
    });
    assert.equal(decision.selectedCardId, "amex_simplycash_preferred");
    assert.equal(decision.estimatedRewardValueCents, 160);
    const wealthsimpleValue = decision.alternatives.find(
      (card) => card.cardId === "ws_credit_infinite",
    );
    assert.equal(wealthsimpleValue?.estimatedRewardValueCents, 160);
  });
});

describe("checkout host mapping for SimplyCash Preferred", () => {
  const extensionCards = getCardsByIds([
    "amex_simplycash_preferred",
    "cibc_dividend_platinum",
    "ws_credit_infinite",
  ]);

  it("routes Metro and Shell to SimplyCash Preferred and Walmart to Dividend Platinum", () => {
    const grocery = recommendCard({
      hostname: "www.metro.ca",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(grocery?.winner.cardId, "amex_simplycash_preferred");
    assert.equal(grocery?.winner.estimatedRewardValueCents, 320);

    const gas = recommendCard({
      hostname: "www.shell.ca",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(gas?.winner.cardId, "amex_simplycash_preferred");
    assert.equal(gas?.winner.estimatedRewardValueCents, 320);

    const walmart = recommendCard({
      hostname: "www.walmart.ca",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(walmart?.winner.cardId, "cibc_dividend_platinum");
    assert.equal(walmart?.winner.estimatedRewardValueCents, 240);
    const simplyCashAtWalmart = walmart?.decision.alternatives.find(
      (card) => card.cardId === "amex_simplycash_preferred",
    );
    assert.equal(simplyCashAtWalmart?.estimatedRewardValueCents, 160);

    const amazon = recommendCard({
      hostname: "www.amazon.ca",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(amazon?.winner.cardId, "amex_simplycash_preferred");
    assert.equal(amazon?.winner.estimatedRewardValueCents, 160);
  });
});
