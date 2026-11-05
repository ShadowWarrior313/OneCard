import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { PortfolioContext, TransactionInput } from "@onecard/shared-types";
import { applyCardRewards } from "./cardRewards";

const privilege = applyCardRewards({
  cardId: "rbc_avion_infinite_privilege",
  issuer: "RBC",
  displayName: "RBC Avion Visa Infinite Privilege Card",
});

const westjet = applyCardRewards({
  cardId: "rbc_westjet",
  issuer: "RBC",
  displayName: "WestJet RBC World Elite Mastercard",
});

function portfolio(): PortfolioContext {
  return {
    cards: [privilege, westjet],
    usage: [],
    preferences: { preferCashback: false },
    defaultCardId: westjet.cardId,
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

describe("RBC Avion Visa Infinite Privilege earn rates", () => {
  it("routes an $80 Amazon purchase to Privilege instead of WestJet", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "amazon", "other", "5399"),
      portfolio: portfolio(),
    });
    // 1.25 Avion points at 1.4¢ is $1.40. WestJet at 1.5% is $1.20.
    // The copied Infinite 1× base scored $1.12 and lost.
    assert.equal(decision.selectedCardId, privilege.cardId);
    assert.equal(decision.estimatedRewardValueCents, 140);
  });

  it("pays 1.25× on grocery, gas, and streaming, which still lose an $80 trip to WestJet", () => {
    const wallet = portfolio();
    const grocery = estimateRewardForCard(
      privilege,
      purchase(80, "metro", "groceries", "5411"),
      "groceries",
      wallet,
    );
    const gas = estimateRewardForCard(
      privilege,
      purchase(80, "shell", "gas", "5541"),
      "gas",
      wallet,
    );
    const streaming = estimateRewardForCard(
      privilege,
      purchase(16, "netflix", "streaming", "5815"),
      "streaming",
      wallet,
    );
    assert.equal(grocery.multiplier, 1.25);
    assert.equal(grocery.estimatedRewardValueCents, 140);
    assert.equal(gas.multiplier, 1.25);
    assert.equal(gas.estimatedRewardValueCents, 140);
    assert.equal(streaming.multiplier, 1.25);
    assert.equal(streaming.estimatedRewardValueCents, 28);

    const metro = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "metro", "groceries", "5411"),
      portfolio: wallet,
    });
    const shell = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "shell", "gas", "5541"),
      portfolio: wallet,
    });
    // WestJet is 2% on grocery and gas: $1.60 beats Privilege at $1.40.
    assert.equal(metro.selectedCardId, westjet.cardId);
    assert.equal(metro.estimatedRewardValueCents, 160);
    assert.equal(shell.selectedCardId, westjet.cardId);
    assert.equal(shell.estimatedRewardValueCents, 160);
  });

  it("keeps an $80 Uber trip on WestJet, which earns 2 points on rideshare", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "uber", "other", "4121"),
      portfolio: portfolio(),
    });
    // Uber is catalogued as other, so the 1.5% base would be $1.20 and lose to
    // Privilege at $1.40. WestJet pays 2 points on MCC 4121, which is $1.60.
    assert.equal(decision.selectedCardId, westjet.cardId);
    assert.equal(decision.multiplier, 2);
    assert.equal(decision.estimatedRewardValueCents, 160);
  });
});
