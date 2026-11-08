import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, PortfolioContext, TransactionInput } from "@onecard/shared-types";
import { applyCardRewards } from "./cardRewards";

const scene = applyCardRewards({
  cardId: "scotia_scene",
  issuer: "Scotiabank",
  displayName: "Scotiabank Scene+ Visa Card",
});

const avion = applyCardRewards({
  cardId: "rbc_avion_infinite",
  issuer: "RBC",
  displayName: "RBC Avion Visa Infinite Card",
});

function portfolio(cards: CardProduct[]): PortfolioContext {
  return {
    cards,
    usage: [],
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

describe("Scotiabank Scene+ Visa earn rates", () => {
  it("routes an $80 Shell fill-up to Avion instead of Scene+", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "shell", "gas", "5541"),
      portfolio: portfolio([scene, avion]),
    });
    // Shell was a 2× merchant rule ($1.60) and beat Avion ($1.12).
    // Issuer accelerators are Empire grocers, Home Hardware, and Cineplex only.
    // Gas is 1 Scene+ point per $1 ($0.80).
    assert.equal(decision.selectedCardId, avion.cardId);
    assert.equal(decision.estimatedRewardValueCents, 112);
  });

  it("keeps 2× at Empire grocers, Home Hardware, and Cineplex", () => {
    for (const merchantId of ["sobeys", "freshco", "iga", "safeway", "foodland", "thrifty_foods"]) {
      const decision = routeTransaction({
        mode: "virtual_provisioning",
        transaction: purchase(80, merchantId, "groceries", "5411"),
        portfolio: portfolio([scene, avion]),
      });
      assert.equal(decision.selectedCardId, scene.cardId, merchantId);
      assert.equal(decision.multiplier, 2, merchantId);
      assert.equal(decision.estimatedRewardValueCents, 160, merchantId);
    }

    const hardware = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "home_hardware", "home_improvement", "5251"),
      portfolio: portfolio([scene, avion]),
    });
    // Home Hardware was 1× ($0.80), so Avion won at $1.12. Issuer pays 2× ($1.60).
    assert.equal(hardware.selectedCardId, scene.cardId);
    assert.equal(hardware.multiplier, 2);
    assert.equal(hardware.estimatedRewardValueCents, 160);

    const cineplex = routeTransaction({
      mode: "virtual_provisioning",
      transaction: purchase(80, "cineplex", "entertainment", "7832"),
      portfolio: portfolio([scene, avion]),
    });
    assert.equal(cineplex.selectedCardId, scene.cardId);
    assert.equal(cineplex.multiplier, 2);
    assert.equal(cineplex.estimatedRewardValueCents, 160);
  });
});
