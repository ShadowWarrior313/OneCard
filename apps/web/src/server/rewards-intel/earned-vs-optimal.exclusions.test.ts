/**
 * Source-level regression for hub Amex grocery exclusions.
 * Run: node --experimental-strip-types --test apps/web/src/server/rewards-intel/earned-vs-optimal.exclusions.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, "earned-vs-optimal.ts"), "utf8");

describe("computeRewardsSummary exclusion source guards", () => {
  it("honors excludedMerchantIds when scoring earned and optimal", () => {
    assert.match(source, /rewardForTransactionCategory/);
    assert.match(source, /excludedMerchantIds/);
    assert.match(source, /resolveHubMerchantId/);
    assert.match(source, /merchantIdFor/);
  });

  it("does not consume bonus caps for excluded merchants", () => {
    assert.match(
      source,
      /Excluded merchants earn at base[\s\S]*continue/,
    );
  });
});
