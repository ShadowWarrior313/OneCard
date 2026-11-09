import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, PortfolioContext, TransactionInput } from "@onecard/shared-types";
import { applyCardRewards } from "./cardRewards";

const momentumNoFee = applyCardRewards({
  cardId: "scotia_momentum_no_fee",
  issuer: "Scotiabank",
  displayName: "Scotia Momentum No-Fee Visa Card",
});

const avion = applyCardRewards({
  cardId: "rbc_avion_infinite",
  issuer: "RBC",
  displayName: "RBC Avion Visa Infinite Card",
});

const ascend = applyCardRewards({
  cardId: "bmo_ascend",
  issuer: "BMO",
  displayName: "BMO Ascend World Elite Mastercard",
});

const rewardsMc = applyCardRewards({
  cardId: "bmo_rewards_mc",
  issuer: "BMO",
  displayName: "BMO Rewards Mastercard",
});

function portfolio(cards: CardProduct[], usage: PortfolioContext["usage"] = []): PortfolioContext {
  return {
    cards,
    usage,
    preferences: { preferCashback: false },
    defaultCardId: cards[0]?.cardId,
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

describe("Scotia Momentum No-Fee Visa earn rates", () => {
  it("routes an $80 grocery trip to Avion instead of the no-fee Momentum card", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "metro", "groceries", "5411"),
      portfolio: portfolio([momentumNoFee, avion]),
    });
    // The catalog paid 2% ($1.60) and beat Avion's 1× ($1.12). The issuer pays
    // 1% at grocery MCC 5411 ($0.80), so Avion wins.
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 112);
    const momentum = decision.alternatives.find((row) => row.cardId === momentumNoFee.cardId);
    assert.equal(momentum?.multiplier, 1);
    assert.equal(momentum?.estimatedRewardValueCents, 80);
  });

  it("routes an $80 recurring bill to Avion instead of the no-fee Momentum card", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "rogers", "recurring_bills", "4814"),
      portfolio: portfolio([momentumNoFee, avion]),
    });
    // Bills were 2% ($1.60) and beat Avion ($1.12). The issuer pays 1% ($0.80).
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 112);
    const momentum = decision.alternatives.find((row) => row.cardId === momentumNoFee.cardId);
    assert.equal(momentum?.estimatedRewardValueCents, 80);
  });

  it("routes an $80 Amazon purchase to Ascend instead of the no-fee Momentum card", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "amazon", "other", "5399"),
      portfolio: portfolio([momentumNoFee, ascend]),
    });
    // Everyday spend was 1% ($0.80) and beat Ascend's 1× at 0.67¢ ($0.536).
    // The issuer pays 0.5% ($0.40) outside the accelerated list.
    assert.equal(decision.selectedCardId, ascend.cardId);
    assert.equal(decision.estimatedRewardValueCents, 53.6);
    const momentum = decision.alternatives.find((row) => row.cardId === momentumNoFee.cardId);
    assert.equal(momentum?.multiplier, 0.5);
    assert.equal(momentum?.estimatedRewardValueCents, 40);
  });

  it("keeps 1% on gas, transit, pharmacies, streaming, and food delivery", () => {
    // Rewards Mastercard is a flat 1× at 0.67¢ ($0.536 on $80) in every category
    // here. Ascend cannot be the opponent: its 5× travel and 3× dining beat 1%.
    const wallet = portfolio([momentumNoFee, rewardsMc]);
    const cases: Array<[string, TransactionInput["category"], string]> = [
      ["shell", "gas", "5541"],
      ["uber", "other", "4121"],
      ["lyft", "other", "4121"],
      ["ttc", "other", "4111"],
      ["presto", "other", "4111"],
      ["go_transit", "other", "4111"],
      ["via_rail", "travel", "4112"],
      ["shoppers", "other", "5912"],
      ["rexall", "other", "5912"],
      ["london_drugs", "other", "5912"],
      ["netflix", "streaming", "5815"],
      ["uber_eats", "dining", "5812"],
      ["doordash", "dining", "5812"],
      ["skip", "dining", "5812"],
    ];
    for (const [merchantId, category, mcc] of cases) {
      const decision = routeTransaction({
        mode: "virtual_provisioning",
        transaction: purchase(80, merchantId, category, mcc),
        portfolio: wallet,
      });
      // Each of these is on the issuer's 1% list ($0.80), which beats a flat
      // 0.67¢ card ($0.536). Dropping them onto the 0.5% base would hand the
      // purchase to that card.
      assert.equal(decision.selectedCardId, momentumNoFee.cardId, merchantId);
      assert.equal(decision.estimatedRewardValueCents, 80, merchantId);
    }
  });

  it("leaves restaurants at 0.5% so Avion keeps an $80 Tim Hortons trip", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "tim_hortons", "dining", "5814"),
      portfolio: portfolio([momentumNoFee, avion]),
    });
    // Food delivery is a selected-merchant list. Restaurant dining is 0.5% ($0.40).
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 140);
    const momentum = decision.alternatives.find((row) => row.cardId === momentumNoFee.cardId);
    assert.equal(momentum?.multiplier, 0.5);
    assert.equal(momentum?.estimatedRewardValueCents, 40);
  });

  it("drops grocery to 0.5% after the shared $15,000 annual cap and loses to Ascend", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "metro", "groceries", "5411"),
      portfolio: portfolio([momentumNoFee, ascend], [
        {
          cardId: momentumNoFee.cardId,
          category: "groceries",
          spendThisPeriod: 15000,
          sharedCapGroup: "scotia_momentum_nofee_accelerated",
        },
      ]),
    });
    // 1% still beats Ascend ($0.80 vs $0.536). After the shared annual cap the
    // rate is 0.5% ($0.40) and Ascend wins.
    assert.equal(decision.selectedCardId, ascend.cardId);
    assert.equal(decision.estimatedRewardValueCents, 53.6);
    const momentum = decision.alternatives.find((row) => row.cardId === momentumNoFee.cardId);
    assert.equal(momentum?.multiplier, 0.5);
    assert.equal(momentum?.estimatedRewardValueCents, 40);
  });
});
