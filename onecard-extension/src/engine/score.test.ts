import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AMEX_GROCERY_EXCLUSIONS,
  isCardAcceptedAtMerchant,
  rewardRuleFor,
  type LinkedCard,
} from "./rewards-rules.ts";
import { scoreRecommendation } from "./score.ts";

const WALLET: LinkedCard[] = [
  {
    id: "amex_cobalt",
    displayName: "American Express Cobalt Card",
    issuer: "American Express",
    network: "amex",
    rewardUnit: "MR points",
    pointValueCents: 2,
    rules: [
      {
        category: "groceries",
        rate: 5,
        unit: "x",
        excludedMerchantIds: [...AMEX_GROCERY_EXCLUSIONS],
      },
      { category: "other", rate: 1, unit: "x" },
    ],
  },
  {
    id: "bmo_cashback_world_elite",
    displayName: "BMO CashBack World Elite Mastercard",
    issuer: "BMO",
    network: "mastercard",
    rewardUnit: "cashback",
    pointValueCents: 1,
    rules: [
      { category: "groceries", rate: 5, unit: "%" },
      { category: "other", rate: 1, unit: "%" },
    ],
  },
  {
    id: "cibc_dividend_infinite",
    displayName: "CIBC Dividend Visa Infinite Card",
    issuer: "CIBC",
    network: "visa",
    rewardUnit: "cashback",
    pointValueCents: 1,
    rules: [
      { category: "groceries", rate: 2, unit: "%" },
      { category: "other", rate: 1, unit: "%" },
    ],
  },
];

function groceryCheckout(merchantId: string, displayName: string) {
  return {
    merchant: {
      id: merchantId,
      displayName,
      mccCandidates: [{ mcc: "5411", confidence: 0.95, reason: "test" }],
    },
    cart: { items: [{ name: "milk" }], total: 100 },
  };
}

describe("extension reward correctness guards", () => {
  it("rejects Amex at Loblaws via network acceptance", () => {
    const amex = WALLET.find((c) => c.id === "amex_cobalt")!;
    assert.equal(isCardAcceptedAtMerchant(amex, "loblaws"), false);
    assert.equal(isCardAcceptedAtMerchant(WALLET[2]!, "loblaws"), true);
  });

  it("recommends a Visa/MC grocery card at Loblaws, never Amex", () => {
    const result = scoreRecommendation(groceryCheckout("loblaws", "Loblaws"), WALLET);
    assert.ok(result);
    assert.notEqual(result!.winner.card.network, "amex");
    assert.equal(result!.winner.card.id, "bmo_cashback_world_elite");
  });

  it("falls back Cobalt grocery bonus at Walmart to base rate", () => {
    const amex = WALLET.find((c) => c.id === "amex_cobalt")!;
    const rule = rewardRuleFor(amex, "groceries", "walmart");
    assert.equal(rule.category, "other");
    assert.equal(rule.rate, 1);
    const result = scoreRecommendation(groceryCheckout("walmart", "Walmart"), WALLET);
    assert.ok(result);
    assert.equal(result!.winner.card.id, "bmo_cashback_world_elite");
  });
});
