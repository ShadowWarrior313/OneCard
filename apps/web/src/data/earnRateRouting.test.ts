import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateRewardForCard, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, PortfolioContext, TransactionInput } from "@onecard/shared-types";
import { applyCardRewards } from "./cardRewards";

const infinite = applyCardRewards({
  cardId: "cibc_aventura_infinite",
  issuer: "CIBC",
  displayName: "CIBC Aventura Visa Infinite Card",
});

const gold = applyCardRewards({
  cardId: "cibc_aventura_gold",
  issuer: "CIBC",
  displayName: "CIBC Aventura Gold Visa Card",
});

const avion = applyCardRewards({
  cardId: "rbc_avion_infinite",
  issuer: "RBC",
  displayName: "RBC Avion Visa Infinite Card",
});

const momentum = applyCardRewards({
  cardId: "scotia_momentum",
  issuer: "Scotiabank",
  displayName: "Scotia Momentum Visa Infinite Card",
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

describe("CIBC Aventura Visa Infinite earn rates", () => {
  it("routes an $80 Tim Hortons visit to Avion instead of Infinite", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "tim_hortons", "dining", "5814"),
      portfolio: portfolio([infinite, avion]),
    });
    // Dining was 2× ($1.92) and beat Avion's 1.25× ($1.40). Issuer pays 1× ($0.96).
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 140);
  });

  it("routes an $80 Amazon purchase and an Air Canada fare to Avion", () => {
    const amazon = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "amazon", "other", "5399"),
      portfolio: portfolio([infinite, avion]),
    });
    // Base earn was 1.5× ($1.44) and beat Avion ($1.12). Issuer base is 1× ($0.96).
    assert.equal(amazon.selectedCardId, avion.cardId);
    assert.equal(amazon.estimatedRewardValueCents, 112);

    const airCanada = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "air_canada", "travel", "3000"),
      portfolio: portfolio([infinite, avion]),
    });
    // 2× applies only to CIBC Rewards Centre bookings, not airline tickets.
    // The old travel rule paid $1.92 and beat Avion's 1.25× ($1.40).
    assert.equal(airCanada.selectedCardId, avion.cardId);
    assert.equal(airCanada.estimatedRewardValueCents, 140);
  });

  it("routes an $80 Shell fill-up to Momentum and keeps 1.5× grocery", () => {
    const shell = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "shell", "gas", "5541"),
      portfolio: portfolio([infinite, momentum]),
    });
    // Gas was 2× ($1.92) and beat Momentum's 2% ($1.60). Issuer gas is 1.5× ($1.44).
    assert.equal(shell.selectedCardId, momentum.cardId);
    assert.equal(shell.estimatedRewardValueCents, 160);

    const metro = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "metro", "groceries", "5411"),
      portfolio: portfolio([infinite, avion]),
    });
    // Groceries are 1.5× ($1.44) and still beat Avion ($1.12).
    assert.equal(metro.selectedCardId, infinite.cardId);
    assert.equal(metro.multiplier, 1.5);
    assert.equal(metro.estimatedRewardValueCents, 144);
  });

  it("pays 1.5× at pharmacies coded as other and excludes Costco warehouse", () => {
    const wallet = portfolio([infinite, avion]);
    for (const merchantId of ["shoppers", "rexall", "london_drugs"]) {
      const decision = routeTransaction({
        mode: "virtual_provisioning",
        transaction: purchase(80, merchantId, "other", "5912"),
        portfolio: wallet,
      });
      assert.equal(decision.selectedCardId, infinite.cardId, merchantId);
      assert.equal(decision.estimatedRewardValueCents, 144, merchantId);
    }

    const costco = estimateRewardForCard(
      infinite,
      purchase(80, "costco", "groceries", "5300"),
      "groceries",
      portfolio([infinite]),
    );
    assert.equal(costco.multiplier, 1);
    assert.equal(costco.estimatedRewardValueCents, 96);
  });

  it("drops the 1.5× grocery and gas rate after $80,000 of bonus spend", () => {
    const usage = [
      {
        cardId: infinite.cardId,
        category: "groceries" as const,
        spendThisPeriod: 80000,
        sharedCapGroup: "cibc_aventura_infinite_bonus",
      },
    ];
    const metro = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "metro", "groceries", "5411"),
      portfolio: portfolio([infinite, avion], usage),
    });
    // Below the cap, Infinite's $1.44 beats Avion's $1.12. After $80,000 the rate is 1× ($0.96).
    assert.equal(metro.selectedCardId, avion.cardId);
    assert.equal(metro.estimatedRewardValueCents, 112);

    const shell = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "shell", "gas", "5541"),
      portfolio: portfolio([infinite, momentum], usage),
    });
    const infiniteGas = shell.alternatives.find((alternative) => alternative.cardId === infinite.cardId);
    assert.equal(infiniteGas?.estimatedRewardValueCents, 96);
    assert.equal(shell.selectedCardId, momentum.cardId);
    assert.equal(shell.estimatedRewardValueCents, 160);
  });
});

describe("CIBC Aventura Gold Visa earn rates", () => {
  it("routes an $80 Metro trip and a Shoppers trip to Gold instead of Avion", () => {
    const metro = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "metro", "groceries", "5411"),
      portfolio: portfolio([gold, avion]),
    });
    // No grocery rule meant 1× ($0.96), so Avion won at $1.12. Issuer grocery is 1.5× ($1.44).
    assert.equal(metro.selectedCardId, gold.cardId);
    assert.equal(metro.multiplier, 1.5);
    assert.equal(metro.estimatedRewardValueCents, 144);

    const shoppers = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "shoppers", "other", "5912"),
      portfolio: portfolio([gold, avion]),
    });
    assert.equal(shoppers.selectedCardId, gold.cardId);
    assert.equal(shoppers.estimatedRewardValueCents, 144);
  });

  it("keeps dining at 1× and does not pay a travel bonus on Air Canada", () => {
    const tims = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "tim_hortons", "dining", "5814"),
      portfolio: portfolio([gold, avion]),
    });
    assert.equal(tims.selectedCardId, avion.cardId);
    assert.equal(tims.estimatedRewardValueCents, 140);

    const airCanada = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "air_canada", "travel", "3000"),
      portfolio: portfolio([gold, avion]),
    });
    // Travel was 1.5× ($1.44) and beat Avion ($1.40). Direct airfare is 1× ($0.96).
    assert.equal(airCanada.selectedCardId, avion.cardId);
    assert.equal(airCanada.estimatedRewardValueCents, 140);
  });

  it("excludes Costco warehouse and drops grocery after $80,000 of bonus spend", () => {
    const costco = estimateRewardForCard(
      gold,
      purchase(80, "costco", "groceries", "5300"),
      "groceries",
      portfolio([gold]),
    );
    assert.equal(costco.multiplier, 1);
    assert.equal(costco.estimatedRewardValueCents, 96);

    const capped = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "metro", "groceries", "5411"),
      portfolio: portfolio(
        [gold, avion],
        [
          {
            cardId: gold.cardId,
            category: "groceries",
            spendThisPeriod: 80000,
            sharedCapGroup: "cibc_aventura_gold_bonus",
          },
        ],
      ),
    });
    assert.equal(capped.selectedCardId, avion.cardId);
    assert.equal(capped.estimatedRewardValueCents, 112);
  });
});
