/**
 * Source-level regression for hub categorization fallbacks.
 * Run: node --experimental-strip-types --test apps/web/src/server/rewards-intel/categorize.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const categorizeSrc = readFileSync(path.join(here, "categorize.ts"), "utf8");
const resolveSrc = readFileSync(path.join(here, "resolveHubMerchant.ts"), "utf8");

describe("categorizeTransaction source guards", () => {
  it("resolves hub merchants through the web catalog before MCC-engine unknown", () => {
    assert.match(categorizeSrc, /resolveHubMerchant/);
    assert.match(resolveSrc, /MERCHANT_PRESETS/);
    assert.match(resolveSrc, /phraseInName/);
  });

  it("falls back to provider budgeting hints when MCC engine returns unknown", () => {
    assert.match(categorizeSrc, /PROVIDER_CATEGORY_FALLBACK/);
    assert.match(categorizeSrc, /providerCategoryFallback/);
    assert.match(categorizeSrc, /TRANSPORT/);
    assert.match(categorizeSrc, /FOOD\|DINING/);
  });

  it("does not map convenience MCC bucket to groceries", () => {
    assert.match(categorizeSrc, /convenience:\s*"other"/);
    assert.doesNotMatch(categorizeSrc, /convenience:\s*"groceries"/);
  });
});
