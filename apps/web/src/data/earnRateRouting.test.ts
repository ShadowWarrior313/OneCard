import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage, PortfolioContext, TransactionInput } from "@onecard/shared-types";
import { applyCardRewards } from "./cardRewards";

const bmo = applyCardRewards({
  cardId: "bmo_cashback",
  issuer: "BMO",
  displayName: "BMO CashBack Mastercard",
});

const avion = applyCardRewards({
  cardId: "rbc_avion_infinite",
  issuer: "RBC",
  displayName: "RBC Avion Visa Infinite Card",
});

function portfolio(usage: CategoryUsage[] = []): PortfolioContext {
  return {
    cards: [bmo, avion],
    usage,
    preferences: { preferCashback: false },
    defaultCardId: avion.cardId,
  };
}

function grocery(amount: number, merchantId: string): TransactionInput {
  return {
    amount,
    merchantName: merchantId,
    merchantId,
    mcc: merchantId === "costco" ? "5300" : "5411",
    category: "groceries",
  };
}

describe("BMO CashBack Mastercard grocery cap", () => {
  it("keeps an $80 Metro trip on BMO after $100 of grocery spend", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: grocery(80, "metro"),
      portfolio: portfolio([
        { cardId: bmo.cardId, category: "groceries", spendThisPeriod: 100 },
      ]),
    });
    // 3% of $80 = $2.40. Avion at 1.4% is $1.12. The old $100 cap scored this at 0.5%.
    assert.equal(decision.selectedCardId, bmo.cardId);
    assert.equal(decision.estimatedRewardValueCents, 240);
  });

  it("routes the default $600 grocery month to BMO instead of Avion", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: grocery(600, "sector_groceries"),
      portfolio: portfolio(),
    });
    // $500 at 3% + $100 at 0.5% = $15.50. Avion earns $8.40. The $100 cap earned $5.50 and lost.
    assert.equal(decision.selectedCardId, bmo.cardId);
    assert.equal(decision.estimatedRewardValueCents, 1550);
  });

  it("falls back to Avion once the $500 statement grocery cap is used", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: grocery(80, "metro"),
      portfolio: portfolio([
        { cardId: bmo.cardId, category: "groceries", spendThisPeriod: 500 },
      ]),
    });
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 112);
  });

  it("does not pay the grocery bonus at Costco warehouse", () => {
    const estimate = estimateRewardForCard(
      bmo,
      grocery(80, "costco"),
      "groceries",
      portfolio(),
    );
    assert.equal(estimate.multiplier, 0.5);
    assert.equal(estimate.estimatedRewardValueCents, 40);
  });

  it("still pays 3% at Walmart Grocery under the cap", () => {
    const estimate = estimateRewardForCard(
      bmo,
      grocery(80, "walmart_grocery"),
      "groceries",
      portfolio(),
    );
    assert.equal(estimate.multiplier, 3);
    assert.equal(estimate.estimatedRewardValueCents, 240);
  });

  it("drops recurring bills to 0.5% after $500 in the statement", () => {
    const estimate = estimateRewardForCard(
      bmo,
      {
        amount: 80,
        merchantName: "Bell",
        merchantId: "sector_utilities",
        mcc: "4900",
        category: "recurring_bills",
      },
      "recurring_bills",
      portfolio([
        { cardId: bmo.cardId, category: "recurring_bills", spendThisPeriod: 500 },
      ]),
    );
    assert.equal(estimate.multiplier, 0.5);
    assert.equal(estimate.estimatedRewardValueCents, 40);
  });
});
