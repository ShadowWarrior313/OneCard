import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, PortfolioContext, TransactionInput } from "@onecard/shared-types";
import { applyCardRewards } from "./cardRewards";

const momentum = applyCardRewards({
  cardId: "scotia_momentum",
  issuer: "Scotiabank",
  displayName: "Scotia Momentum Visa Infinite Card",
});

const avion = applyCardRewards({
  cardId: "rbc_avion_infinite",
  issuer: "RBC",
  displayName: "RBC Avion Visa Infinite Card",
});

const ion = applyCardRewards({
  cardId: "rbc_ion",
  issuer: "RBC",
  displayName: "RBC Ion Visa Card",
});

const cobalt = applyCardRewards({
  cardId: "amex_cobalt",
  issuer: "American Express",
  displayName: "American Express Cobalt Card",
});

const dividend = applyCardRewards({
  cardId: "cibc_dividend_infinite",
  issuer: "CIBC",
  displayName: "CIBC Dividend Visa Infinite Card",
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

describe("Scotia Momentum Visa Infinite earn rates", () => {
  it("routes an $80 Uber trip to Momentum instead of Avion or Ion", () => {
    const uber = purchase(80, "uber", "other", "4121");
    const againstAvion = routeTransaction({
      mode: "virtual_provisioning",
      transaction: uber,
      portfolio: portfolio([momentum, avion]),
    });
    // Uber is catalogued as other (MCC 4121). The old 1% base paid $0.80 and
    // lost to Avion at $1.12. Transit and rideshare earn 2% ($1.60).
    assert.equal(againstAvion.selectedCardId, momentum.cardId);
    assert.equal(againstAvion.multiplier, 2);
    assert.equal(againstAvion.estimatedRewardValueCents, 160);

    const againstIon = routeTransaction({
      mode: "virtual_provisioning",
      transaction: uber,
      portfolio: portfolio([momentum, ion, dividend]),
    });
    // Ion's 3× transportation rule does not match category other, so Ion earns
    // 1× Avion ($1.12). Dividend earns 1%. Momentum at 2% is the non-Amex winner.
    assert.equal(againstIon.selectedCardId, momentum.cardId);
    assert.equal(againstIon.estimatedRewardValueCents, 160);
  });

  it("pays 2% on catalog transit brands and VIA Rail, and keeps dining at 1%", () => {
    const wallet = portfolio([momentum, avion]);
    for (const merchantId of ["lyft", "ttc", "presto", "go_transit", "sector_transport"]) {
      const decision = routeTransaction({
        mode: "virtual_provisioning",
        transaction: purchase(80, merchantId, "other", "4111"),
        portfolio: wallet,
      });
      assert.equal(decision.selectedCardId, momentum.cardId, merchantId);
      assert.equal(decision.estimatedRewardValueCents, 160, merchantId);
    }

    const via = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "via_rail", "travel", "4112"),
      portfolio: wallet,
    });
    // VIA is catalogued as travel, where Avion earns 1.25× ($1.40).
    // MCC 4112 is in Momentum's published 2% list ($1.60).
    assert.equal(via.selectedCardId, momentum.cardId);
    assert.equal(via.estimatedRewardValueCents, 160);

    const tims = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "tim_hortons", "dining", "5814"),
      portfolio: wallet,
    });
    // Food delivery is a selected-merchant list that can change. Dining stays at 1%.
    assert.equal(tims.selectedCardId, avion.cardId);
    assert.equal(tims.estimatedRewardValueCents, 140);
  });

  it("keeps the 4% grocery rate after $250 of grocery spend and drops it after $25,000", () => {
    const metro = purchase(80, "metro", "groceries", "5411");
    const stillAccelerated = routeTransaction({
      mode: "virtual_provisioning",
      transaction: metro,
      portfolio: portfolio([momentum, avion], [
        {
          cardId: momentum.cardId,
          category: "groceries",
          spendThisPeriod: 250,
          sharedCapGroup: "scotia_momentum_infinite_4",
        },
      ]),
    });
    // The old cap was $250 per month, so this trip fell to 1% ($0.80) and lost
    // to Avion ($1.12). The issuer cap is $25,000 per year.
    assert.equal(stillAccelerated.selectedCardId, momentum.cardId);
    assert.equal(stillAccelerated.estimatedRewardValueCents, 320);

    const capped = routeTransaction({
      mode: "virtual_provisioning",
      transaction: metro,
      portfolio: portfolio([momentum, avion], [
        {
          cardId: momentum.cardId,
          category: "groceries",
          spendThisPeriod: 25000,
          sharedCapGroup: "scotia_momentum_infinite_4",
        },
      ]),
    });
    assert.equal(capped.selectedCardId, avion.cardId);
    assert.equal(capped.estimatedRewardValueCents, 112);
  });

  it("excludes Costco warehouse from the grocery bonus and still pays 2% at Shell", () => {
    const costco = estimateRewardForCard(
      momentum,
      purchase(80, "costco", "groceries", "5300"),
      "groceries",
      portfolio([momentum]),
    );
    assert.equal(costco.multiplier, 1);
    assert.equal(costco.estimatedRewardValueCents, 80);

    const shell = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "shell", "gas", "5541"),
      portfolio: portfolio([momentum, avion]),
    });
    assert.equal(shell.selectedCardId, momentum.cardId);
    assert.equal(shell.estimatedRewardValueCents, 160);
  });

  it("ties Cobalt on an $80 Uber trip in the default wallet", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "uber", "other", "4121"),
      portfolio: portfolio([cobalt, dividend, momentum, ion]),
    });
    const momentumValue = decision.alternatives.find(
      (alternative) => alternative.cardId === momentum.cardId,
    );
    // Cobalt's 1× base is valued at 2¢, the same $1.60 as Momentum's 2% cash back.
    assert.equal(momentumValue?.estimatedRewardValueCents, 160);
    assert.equal(decision.selectedCardId, cobalt.cardId);
    assert.equal(decision.estimatedRewardValueCents, 160);
  });
});
