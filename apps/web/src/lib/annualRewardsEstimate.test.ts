import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CardProduct } from "@onecard/shared-types";
import {
  applyEstimateUsage,
  computeAnnualRewardsComparison,
  defaultMonthlySpend,
} from "./annualRewardsEstimate.ts";

const RBC_ION: CardProduct = {
  cardId: "rbc_ion",
  issuer: "RBC",
  displayName: "RBC Ion Visa Card",
  currency: "Avion points",
  pointValueCents: 1.4,
  network: "visa",
  rewards: [
    {
      category: "groceries",
      multiplier: 3,
      capMonthly: 500,
      sharedCapGroup: "rbc_ion_bonus",
    },
    {
      category: "dining",
      multiplier: 3,
      capMonthly: 500,
      sharedCapGroup: "rbc_ion_bonus",
    },
    {
      category: "gas",
      multiplier: 3,
      capMonthly: 500,
      sharedCapGroup: "rbc_ion_bonus",
    },
    { category: "other", multiplier: 1 },
  ],
};

describe("annualRewardsEstimate shared caps", () => {
  it("accumulates sharedCapGroup spend across categories", () => {
    const usage: Parameters<typeof applyEstimateUsage>[0] = [];
    applyEstimateUsage(usage, "rbc_ion", "groceries", 400, RBC_ION);
    applyEstimateUsage(usage, "rbc_ion", "dining", 200, RBC_ION);
    assert.equal(usage.length, 1);
    assert.equal(usage[0]?.sharedCapGroup, "rbc_ion_bonus");
    assert.equal(usage[0]?.spendThisPeriod, 600);
  });

  it("does not treat each category as a fresh shared bonus cap", () => {
    const spend = defaultMonthlySpend();
    // Heavy groceries + dining alone exceed the $500 shared Ion bonus.
    spend.groceries = 600;
    spend.dining = 350;
    spend.gas = 0;
    spend.travel = 0;
    spend.streaming = 0;
    spend.recurring_bills = 0;
    spend.other = 0;

    const result = computeAnnualRewardsComparison([RBC_ION], "rbc_ion", spend);
    assert.ok(result);

    // If usage reset per category: groceries blend ($500@3x+$100@1x) + dining
    // full $350@3x. With shared ledger: after $500 groceries bonus, dining is 1x.
    // pointValueCents=1.4 → dollars = amount * multiplier * 1.4 / 100.
    const overstatedMonthly =
      ((500 * 3 + 100 * 1) * 1.4) / 100 + (350 * 3 * 1.4) / 100;
    const correctMonthly =
      ((500 * 3 + 100 * 1) * 1.4) / 100 + (350 * 1 * 1.4) / 100;

    const expectedCorrectAnnual = Math.round(correctMonthly * 12 * 100) / 100;
    const overstatedAnnual = Math.round(overstatedMonthly * 12 * 100) / 100;
    assert.equal(result.defaultAnnual, expectedCorrectAnnual);
    assert.ok(result.defaultAnnual < overstatedAnnual - 1);
  });
});
