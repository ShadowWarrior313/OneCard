import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categorizeTransaction } from "./categorize.ts";
import { computeRewardsSummary } from "./earned-vs-optimal.ts";
import type { SafeHubTransaction } from "../../data/schema.ts";

function txn(
  partial: Omit<SafeHubTransaction, "categorized" | "pending" | "currency" | "source"> & {
    merchantName: string;
  },
): SafeHubTransaction {
  return {
    id: partial.id,
    date: partial.date,
    amount: partial.amount,
    merchantName: partial.merchantName,
    trackedCardId: partial.trackedCardId,
    accountId: partial.accountId,
    website: partial.website,
    pending: false,
    currency: "CAD",
    source: "manual",
    categorized: categorizeTransaction({
      merchantName: partial.merchantName,
      website: partial.website,
    }),
  };
}

describe("computeRewardsSummary exclusions", () => {
  it("does not award Cobalt 5x groceries at Loblaws (issuer exclusion)", () => {
    const month = new Date().toISOString().slice(0, 7);
    const loblaws = txn({
      id: "t1",
      date: `${month}-05`,
      amount: 100,
      merchantName: "LOBLAWS #42",
      trackedCardId: "amex_cobalt",
    });
    const summary = computeRewardsSummary({
      transactions: [loblaws],
      accounts: [],
      walletCardIds: ["amex_cobalt", "scotia_momentum"],
    });
    // Cobalt base (~2¢/pt × 1x) on $100 = $2; must not be $10 (5x).
    assert.ok(summary.earned < 3, `earned=${summary.earned}`);
    // Scotia Momentum 4% groceries should be the optimal path.
    assert.ok(summary.optimal >= 3.5, `optimal=${summary.optimal}`);
    assert.ok(summary.missed > 0, `missed=${summary.missed}`);
  });
});
