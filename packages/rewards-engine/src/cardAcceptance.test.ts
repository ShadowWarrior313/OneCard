import { describe, it, expect } from "vitest";
import type { CardProduct } from "@onecard/shared-types";
import {
  isCardAcceptedAtMerchant,
  networkFromProductName,
  resolveCardNetwork,
} from "./cardAcceptance.js";
import { routeTransaction } from "./routeTransaction.js";

describe("networkFromProductName", () => {
  it("reads Mastercard / Visa / Amex / Discover from the official name", () => {
    expect(networkFromProductName("WestJet RBC World Elite Mastercard")).toBe(
      "mastercard",
    );
    expect(networkFromProductName("BMO CashBack Mastercard")).toBe("mastercard");
    expect(networkFromProductName("CIBC Dividend Visa Infinite Card")).toBe("visa");
    expect(networkFromProductName("Manulife Visa Benefits Card")).toBe("visa");
    expect(networkFromProductName("American Express Cobalt Card")).toBe("amex");
    expect(networkFromProductName("Discover it Cash Back")).toBe("discover");
  });

  it("does not guess when the name does not name a network", () => {
    expect(networkFromProductName("RBC Ion Card")).toBeUndefined();
  });
});

describe("resolveCardNetwork", () => {
  it("overrides a declared network that contradicts the product name", () => {
    expect(resolveCardNetwork("WestJet RBC World Elite Mastercard", "visa")).toBe(
      "mastercard",
    );
    expect(resolveCardNetwork("Manulife Visa Benefits Card", "mastercard")).toBe(
      "visa",
    );
  });

  it("keeps the declared network when the name is silent", () => {
    expect(resolveCardNetwork("RBC Ion Card", "visa")).toBe("visa");
  });
});

describe("Costco network acceptance", () => {
  const cobalt: CardProduct = {
    cardId: "amex_cobalt",
    issuer: "American Express",
    displayName: "American Express Cobalt Card",
    currency: "MR points",
    pointValueCents: 2,
    network: "amex",
    rewards: [{ category: "other", multiplier: 1 }],
  };
  const westjetMislabelled: CardProduct = {
    cardId: "rbc_westjet",
    issuer: "RBC",
    displayName: "WestJet RBC World Elite Mastercard",
    currency: "WestJet dollars",
    pointValueCents: 1,
    // Catalog bug this guard exists to stop: World Elite Mastercard stored as visa.
    network: resolveCardNetwork("WestJet RBC World Elite Mastercard", "visa"),
    rewards: [{ category: "other", multiplier: 1.5 }],
  };
  const momentum: CardProduct = {
    cardId: "scotia_momentum",
    issuer: "Scotiabank",
    displayName: "Scotia Momentum Visa Infinite Card",
    currency: "cashback %",
    pointValueCents: 1,
    network: "visa",
    rewards: [{ category: "other", multiplier: 1 }],
  };

  it("accepts a Mastercard at Costco even if the catalog declared Visa", () => {
    expect(isCardAcceptedAtMerchant(westjetMislabelled, "costco")).toBe(true);
    expect(isCardAcceptedAtMerchant(cobalt, "costco")).toBe(false);
    expect(isCardAcceptedAtMerchant(momentum, "costco")).toBe(false);
  });

  it("routes Costco to the held Mastercard instead of failing closed", () => {
    const decision = routeTransaction({
      mode: "virtual_provisioning",
      transaction: {
        amount: 200,
        merchantName: "Costco",
        mcc: "5300",
        merchantId: "costco",
        category: "other",
      },
      portfolio: {
        cards: [cobalt, westjetMislabelled, momentum],
        usage: [],
        preferences: { preferCashback: false },
      },
    });
    expect(decision.selectedCardId).toBe("rbc_westjet");
    expect(decision.multiplier).toBe(1.5);
  });
});
