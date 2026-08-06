/**
 * Source-level regression for counterfactual cap accounting.
 * Run: node --experimental-strip-types --test apps/web/src/server/rewards-intel/earned-vs-optimal.test.ts
 *
 * Uses a lightweight stub of card reward lookups so we do not pull Next.js
 * server-only modules under plain Node.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, "earned-vs-optimal.ts"), "utf8");

test("computeRewardsSummary tracks separate actual vs optimal usage paths", () => {
  assert.match(source, /usageActual/);
  assert.match(source, /usageOptimal/);
  assert.match(
    source,
    /if \(cardId && optimalCardId\) applyUsage\(transaction, optimalCardId, usageOptimal\)/,
  );
  assert.doesNotMatch(
    source,
    /if \(cardId\) applyUsage\(transaction, cardId, usage\);\n  \}/,
  );
});
