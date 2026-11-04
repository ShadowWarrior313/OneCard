import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { CategoryUsage, PortfolioContext, TransactionInput } from "@onecard/shared-types";
import { applyCardRewards } from "./cardRewards";

const td = applyCardRewards({
  cardId: "td_cashback",
  issuer: "TD",
  displayName: "TD Cash Back Visa Card",
});

const avion = applyCardRewards({
  cardId: "rbc_avion_infinite",
  issuer: "RBC",
  displayName: "RBC Avion Visa Infinite Card",
});

function portfolio(usage: CategoryUsage[] = []): PortfolioContext {
  return {
    cards: [td, avion],
    usage,
    preferences: { preferCashback: false },
    defaultCardId: avion.cardId,
  };
}

function purchase(
  amount: number,
  merchantId: string,
  category: TransactionInput["category"],
  mcc: string,
): TransactionInput {
  return {
    amount,
    merchantName: merchantId,
    merchantId,
    mcc,
    category,
  };
}

describe("TD Cash Back Visa no-fee earn rates", () => {
  it("routes an $80 Metro trip to Avion instead of the 2% grocery rate", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "metro", "groceries", "5411"),
      portfolio: portfolio(),
    });
    // 1% of $80 = $0.80. Avion at 1.4% is $1.12. The old 2% rate scored $1.60 and won.
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 112);
  });

  it("routes an $80 Shell fill to Avion instead of the 2% gas rate", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "shell", "gas", "5541"),
      portfolio: portfolio(),
    });
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 112);
  });

  it("pays 1% at Walmart Grocery, which is a supermarket MCC", () => {
    const estimate = estimateRewardForCard(
      td,
      purchase(80, "walmart_grocery", "groceries", "5411"),
      "groceries",
      portfolio(),
    );
    assert.equal(estimate.multiplier, 1);
    assert.equal(estimate.estimatedRewardValueCents, 80);
  });

  it("keeps a $600 grocery month on Avion while the $5,000 annual cap still applies", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(600, "sector_groceries", "groceries", "5411"),
      portfolio: portfolio(),
    });
    // 1% of $600 = $6.00. Avion earns $8.40. The old $100 monthly cap earned $4.50 and also lost.
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 840);
  });

  it("drops grocery earn to 0.5% after $5,000 of grocery spend", () => {
    const estimate = estimateRewardForCard(
      td,
      purchase(80, "metro", "groceries", "5411"),
      "groceries",
      portfolio([
        { cardId: td.cardId, category: "groceries", spendThisPeriod: 5000 },
      ]),
    );
    assert.equal(estimate.multiplier, 0.5);
    assert.equal(estimate.estimatedRewardValueCents, 40);
  });

  it("pays 1% on recurring bills and streaming, and 0.5% on dining", () => {
    const bills = estimateRewardForCard(
      td,
      purchase(80, "sector_utilities", "recurring_bills", "4900"),
      "recurring_bills",
      portfolio(),
    );
    const streaming = estimateRewardForCard(
      td,
      purchase(45, "netflix", "streaming", "5815"),
      "streaming",
      portfolio(),
    );
    const dining = estimateRewardForCard(
      td,
      purchase(80, "tim_hortons", "dining", "5814"),
      "dining",
      portfolio(),
    );
    assert.equal(bills.estimatedRewardValueCents, 80);
    assert.equal(streaming.estimatedRewardValueCents, 45);
    assert.equal(dining.multiplier, 0.5);
    assert.equal(dining.estimatedRewardValueCents, 40);
  });
});
