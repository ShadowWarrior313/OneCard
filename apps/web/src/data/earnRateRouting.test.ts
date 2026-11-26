import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RewardCategory } from "@onecard/shared-types";
import { getCardsByIds, recommendCard } from "../../../../packages/optimizer/src/index.ts";
import { applyCardRewards } from "./cardRewards.ts";

const AMOUNT = 80;

function product(cardId: string, issuer: string, displayName: string): CardProduct {
  return applyCardRewards({ cardId, issuer, displayName });
}

const gold = product(
  "amex_gold",
  "American Express",
  "American Express Gold Rewards Card",
);
const simplii = product(
  "simplii_cashback_visa",
  "Simplii Financial",
  "Simplii Financial Cash Back Visa Card",
);
const costco = product(
  "cibc_costco",
  "CIBC",
  "CIBC Costco Mastercard",
);
const cobalt = product(
  "amex_cobalt",
  "American Express",
  "American Express Cobalt Card",
);
const avion = product(
  "rbc_avion_infinite",
  "RBC",
  "RBC Avion Visa Infinite Card",
);

function route(
  cards: CardProduct[],
  merchant: { name: string; id?: string; mcc: string; category: RewardCategory },
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
      usage: [],
      preferences: { preferCashback: false },
      defaultCardId: cards[0]!.cardId,
    },
  });
}

describe("American Express Gold Rewards dining earn rate", () => {
  it("pays 1 point per dollar at Tim Hortons, so Simplii's 4% wins", () => {
    const decision = route([gold, simplii], {
      name: "Tim Hortons",
      id: "tim_hortons",
      mcc: "5814",
      category: "dining",
    });
    assert.equal(decision.selectedCardId, "simplii_cashback_visa");
    // $80 * 4% = $3.20. Gold is 1 MR point at 2¢ = $1.60.
    assert.equal(decision.estimatedRewardValueCents, 320);
    const goldValue = decision.alternatives.find((card) => card.cardId === "amex_gold");
    assert.equal(goldValue?.multiplier, 1);
    assert.equal(goldValue?.estimatedRewardValueCents, 160);
  });

  it("pays 1 point per dollar at restaurants, so the Costco Mastercard's 3% wins", () => {
    const decision = route([gold, costco], {
      name: "Tim Hortons",
      id: "tim_hortons",
      mcc: "5814",
      category: "dining",
    });
    assert.equal(decision.selectedCardId, "cibc_costco");
    // $80 * 3% = $2.40. Gold at 1x is $1.60.
    assert.equal(decision.estimatedRewardValueCents, 240);
    const goldValue = decision.alternatives.find((card) => card.cardId === "amex_gold");
    assert.equal(goldValue?.estimatedRewardValueCents, 160);
  });

  it("still lets Cobalt win dining in a wallet that also has Gold", () => {
    const decision = route([gold, simplii, cobalt], {
      name: "Tim Hortons",
      id: "tim_hortons",
      mcc: "5814",
      category: "dining",
    });
    assert.equal(decision.selectedCardId, "amex_cobalt");
    // $80 * 5 MR points * 2¢ = $8.00.
    assert.equal(decision.estimatedRewardValueCents, 800);
  });

  it("keeps 2 points per dollar on stand-alone groceries, gas, and travel", () => {
    const grocery = route([gold, avion], {
      name: "Metro",
      id: "metro",
      mcc: "5411",
      category: "groceries",
    });
    assert.equal(grocery.selectedCardId, "amex_gold");
    // $80 * 2 MR points * 2¢ = $3.20. Avion everyday is 1 point at 1.4¢ = $1.12.
    assert.equal(grocery.estimatedRewardValueCents, 320);

    const gas = route([gold, avion], {
      name: "Shell",
      id: "shell",
      mcc: "5541",
      category: "gas",
    });
    assert.equal(gas.selectedCardId, "amex_gold");
    assert.equal(gas.estimatedRewardValueCents, 320);

    const travel = route([gold, avion], {
      name: "Air Canada",
      id: "air_canada",
      mcc: "3000",
      category: "travel",
    });
    assert.equal(travel.selectedCardId, "amex_gold");
    assert.equal(travel.estimatedRewardValueCents, 320);
  });
});

describe("checkout host mapping for American Express Gold Rewards", () => {
  const extensionCards = getCardsByIds([
    "amex_gold",
    "simplii_cashback_visa",
    "cibc_costco",
  ]);

  it("routes Tim Hortons to Simplii and keeps Metro on Gold", () => {
    const dining = recommendCard({
      hostname: "www.timhortons.ca",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(dining?.winner.cardId, "simplii_cashback_visa");
    assert.equal(dining?.winner.estimatedRewardValueCents, 320);
    const goldAtTims = dining?.decision.alternatives.find(
      (card) => card.cardId === "amex_gold",
    );
    assert.equal(goldAtTims?.estimatedRewardValueCents, 160);

    const grocery = recommendCard({
      hostname: "www.metro.ca",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(grocery?.winner.cardId, "amex_gold");
    assert.equal(grocery?.winner.estimatedRewardValueCents, 320);
  });
});
