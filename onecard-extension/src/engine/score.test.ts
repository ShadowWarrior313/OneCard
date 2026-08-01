import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AMEX_GROCERY_EXCLUSIONS,
  isCardAcceptedAtMerchant,
  normalizedCashbackPercent,
  rewardRuleFor,
  type LinkedCard,
} from "./rewards-rules.ts";

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

function bestEligibleGroceryCard(merchantId: string): string | undefined {
  const eligible = WALLET.filter((card) => isCardAcceptedAtMerchant(card, merchantId));
  const scored = eligible.map((card) => {
    const rule = rewardRuleFor(card, "groceries", merchantId);
    return { id: card.id, pct: normalizedCashbackPercent(card, rule) };
  });
  scored.sort((a, b) => b.pct - a.pct);
  return scored[0]?.id;
}

describe("extension reward correctness guards", () => {
  it("rejects Amex at Loblaws via network acceptance", () => {
    const amex = WALLET.find((c) => c.id === "amex_cobalt")!;
    assert.equal(isCardAcceptedAtMerchant(amex, "loblaws"), false);
    assert.equal(isCardAcceptedAtMerchant(WALLET[2]!, "loblaws"), true);
  });

  it("recommends a Visa/MC grocery card at Loblaws, never Amex", () => {
    const winnerId = bestEligibleGroceryCard("loblaws");
    assert.equal(winnerId, "bmo_cashback_world_elite");
    assert.notEqual(WALLET.find((c) => c.id === winnerId)?.network, "amex");
  });

  it("falls back Cobalt grocery bonus at Walmart to base rate", () => {
    const amex = WALLET.find((c) => c.id === "amex_cobalt")!;
    const rule = rewardRuleFor(amex, "groceries", "walmart");
    assert.equal(rule.category, "other");
    assert.equal(rule.rate, 1);
    assert.equal(bestEligibleGroceryCard("walmart"), "bmo_cashback_world_elite");
  });
});
