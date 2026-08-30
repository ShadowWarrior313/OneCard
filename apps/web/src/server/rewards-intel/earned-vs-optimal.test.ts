import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SafeHubTransaction } from "../../data/schema.ts";
import { computeRewardsSummary } from "./earned-vs-optimal.ts";

function txn(
  id: string,
  amount: number,
  date: string,
  category: SafeHubTransaction["categorized"]["category"],
): SafeHubTransaction {
  return {
    id,
    source: "manual",
    trackedCardId: "amex_cobalt",
    merchantName: category === "groceries" ? "Metro" : "Tim Hortons",
    amount,
    date,
    pending: false,
    currency: "CAD",
    categorized: {
      category,
      confidence: 1,
      confidenceBand: "high",
      ambiguous: false,
      candidates: [
        {
          mcc: category === "groceries" ? "5411" : "5814",
          label: category,
          category,
          probability: 1,
        },
      ],
    },
  };
}

describe("Cobalt combined eats & drinks cap", () => {
  it("does not pay 5× on dining after grocery spend has filled the shared $2,500 cap", () => {
    const summary = computeRewardsSummary({
      transactions: [
        txn("g1", 2000, "2026-08-04", "groceries"),
        txn("d1", 800, "2026-08-12", "dining"),
      ],
      accounts: [],
      walletCardIds: ["amex_cobalt"],
      month: "2026-08",
    });
    // 5× MR at 2¢ = 10% on the first $2,500 combined, then 1× = 2% on the remaining $300.
    assert.equal(summary.earned, 256);
    assert.equal(summary.spent, 2800);
  });
});
