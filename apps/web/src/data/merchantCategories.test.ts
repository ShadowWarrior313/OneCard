/**
 * Source-level guard: Costco warehouse must not be forced to groceries.
 * Run: node --experimental-strip-types --test apps/web/src/data/merchantCategories.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const brands = readFileSync(path.join(here, "merchantBrands.ts"), "utf8");

describe("merchant catalog category alignment", () => {
  it("does not force Costco (MCC 5300) into groceries", () => {
    assert.match(
      brands,
      /id:\s*"costco"[\s\S]*?mcc:\s*"5300"[\s\S]*?category:\s*"other"/,
    );
    assert.doesNotMatch(
      brands,
      /id:\s*"costco"[^}]*category:\s*"groceries"/,
    );
  });
});
