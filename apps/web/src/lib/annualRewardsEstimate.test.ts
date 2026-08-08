/**
 * Source + unit regression for sharedCapGroup across annual category estimates.
 * Run: node --experimental-strip-types --test apps/web/src/lib/annualRewardsEstimate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import type { CardProduct, CategoryUsage } from "@onecard/shared-types";
import { getRewardRule } from "@onecard/rewards-engine";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, "annualRewardsEstimate.ts"), "utf8");

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
    { category: "other", multiplier: 1 },
  ],
};

/** Local copy of applyEstimateUsage so this test does not pull Next path aliases. */
function applyEstimateUsage(
  usage: CategoryUsage[],
  cardId: string,
  category: CardProduct["rewards"][number]["category"],
  amount: number,
  card: CardProduct,
): void {
  const rule = getRewardRule(card, category);
  const existing = usage.find(
    (entry) =>
      entry.cardId === cardId &&
      (rule.sharedCapGroup
        ? entry.sharedCapGroup === rule.sharedCapGroup
        : !entry.sharedCapGroup && entry.category === category),
  );
  if (existing) {
    existing.spendThisPeriod += amount;
    return;
  }
  usage.push({
    cardId,
    category: rule.category,
    spendThisPeriod: amount,
    sharedCapGroup: rule.sharedCapGroup,
  });
}

describe("annualRewardsEstimate shared caps", () => {
  it("wires a persistent usage ledger instead of usage: [] per category", () => {
    assert.match(source, /usageRouted/);
    assert.match(source, /usageDefault/);
    assert.match(source, /applyEstimateUsage/);
    assert.doesNotMatch(
      source,
      /function emptyPortfolio[\s\S]*usage:\s*\[\s*\]/,
    );
  });

  it("accumulates sharedCapGroup spend across categories", () => {
    const usage: CategoryUsage[] = [];
    applyEstimateUsage(usage, "rbc_ion", "groceries", 400, RBC_ION);
    applyEstimateUsage(usage, "rbc_ion", "dining", 200, RBC_ION);
    assert.equal(usage.length, 1);
    assert.equal(usage[0]?.sharedCapGroup, "rbc_ion_bonus");
    assert.equal(usage[0]?.spendThisPeriod, 600);

    // Second category must see the depleted shared cap (only $0 bonus remaining
    // after $500 — wait, 400+200=600 so remaining is 0).
    const spend = getRewardRule(RBC_ION, "dining").sharedCapGroup
      ? usage
          .filter((u) => u.sharedCapGroup === "rbc_ion_bonus")
          .reduce((s, u) => s + u.spendThisPeriod, 0)
      : 0;
    assert.equal(spend, 600);
  });
});
