import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RewardCategory } from "@onecard/shared-types";
import { getCardsByIds, recommendCard } from "../../../../packages/optimizer/src/index.ts";
import { applyCardRewards } from "./cardRewards.ts";

const AMOUNT = 80;

function product(cardId: string, issuer: string, displayName: string): CardProduct {
  return applyCardRewards({ cardId, issuer, displayName });
}

const koho = product("koho_premium", "KOHO", "KOHO Premium Prepaid Mastercard");
const avion = product("rbc_avion_infinite", "RBC", "RBC Avion Visa Infinite Card");

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

describe("KOHO Premium transportation earn rate", () => {
  it("pays 2% on an Uber trip that the catalog codes as other, ahead of Avion", () => {
    const decision = route([koho, avion], {
      name: "Uber",
      id: "uber",
      mcc: "4121",
      category: "other",
    });
    assert.equal(decision.selectedCardId, "koho_premium");
    // $80 * 2% = $1.60. Avion's everyday rate is 1.4% = $1.12.
    assert.equal(decision.estimatedRewardValueCents, 160);
    const avionValue = decision.alternatives.find(
      (card) => card.cardId === "rbc_avion_infinite",
    );
    assert.equal(avionValue?.estimatedRewardValueCents, 112);
  });

  it("pays 2% on TTC and other local transit coded as other", () => {
    for (const merchant of [
      { name: "TTC", id: "ttc", mcc: "4111" },
      { name: "Presto", id: "presto", mcc: "4111" },
      { name: "GO Transit", id: "go_transit", mcc: "4111" },
      { name: "Lyft", id: "lyft", mcc: "4121" },
    ]) {
      const decision = route([koho, avion], {
        ...merchant,
        category: "other",
      });
      assert.equal(decision.selectedCardId, "koho_premium", merchant.id);
      assert.equal(decision.estimatedRewardValueCents, 160, merchant.id);
    }
  });

  it("pays 2% when the checkout host maps Uber to transportation", () => {
    const decision = route([koho, avion], {
      name: "Uber",
      id: "uber",
      mcc: "4121",
      category: "transportation",
    });
    assert.equal(decision.selectedCardId, "koho_premium");
    assert.equal(decision.estimatedRewardValueCents, 160);
  });

  it("keeps gas, groceries, dining, and everyday spend on their existing rates", () => {
    const shell = route([koho, avion], {
      name: "Shell",
      id: "shell",
      mcc: "5541",
      category: "gas",
    });
    assert.equal(shell.selectedCardId, "rbc_avion_infinite");
    const shellKoho = shell.alternatives.find((card) => card.cardId === "koho_premium");
    assert.equal(shellKoho?.estimatedRewardValueCents, 40);

    const metro = route([koho, avion], {
      name: "Metro",
      id: "metro",
      mcc: "5411",
      category: "groceries",
    });
    assert.equal(metro.selectedCardId, "koho_premium");
    assert.equal(metro.estimatedRewardValueCents, 160);

    const portfolio = {
      cards: [koho],
      usage: [],
      preferences: { preferCashback: false as const },
    };
    const tims = estimateRewardForCard(
      koho,
      {
        amount: AMOUNT,
        merchantName: "Tim Hortons",
        merchantId: "tim_hortons",
        mcc: "5814",
        category: "dining",
      },
      "dining",
      portfolio,
    );
    assert.equal(tims.estimatedRewardValueCents, 160);

    const amazon = route([koho, avion], {
      name: "Amazon",
      id: "amazon",
      mcc: "5399",
      category: "retail",
    });
    assert.equal(amazon.selectedCardId, "rbc_avion_infinite");
    const amazonKoho = amazon.alternatives.find((card) => card.cardId === "koho_premium");
    assert.equal(amazonKoho?.estimatedRewardValueCents, 40);
  });
});

describe("checkout host mapping for KOHO Premium", () => {
  const extensionCards = getCardsByIds(["koho_premium", "rbc_avion_infinite"]);

  it("routes uber.com to KOHO Premium and shell.ca to Avion", () => {
    const uber = recommendCard({
      hostname: "www.uber.com",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(uber?.winner.cardId, "koho_premium");
    assert.equal(uber?.winner.estimatedRewardValueCents, 160);

    const shell = recommendCard({
      hostname: "www.shell.ca",
      cards: extensionCards,
      amount: AMOUNT,
    });
    assert.equal(shell?.winner.cardId, "rbc_avion_infinite");
    const kohoAtShell = shell?.decision.alternatives.find(
      (card) => card.cardId === "koho_premium",
    );
    assert.equal(kohoAtShell?.estimatedRewardValueCents, 40);
  });
});
