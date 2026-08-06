import assert from "node:assert/strict";
import { test } from "node:test";
import { merchantMccForIdentity } from "./mcc-map.ts";
import { categoryForMcc, STORE_OFFER_RULES } from "./rewards-rules.ts";

test("Walmart primary MCC is discount 5310, not grocery 5411", () => {
  const entry = merchantMccForIdentity("walmart", "walmart.ca");
  assert.equal(entry.candidates[0]?.mcc, "5310");
  assert.equal(categoryForMcc(entry.candidates[0]!.mcc), "retail");
  assert.ok((entry.candidates[0]?.confidence ?? 0) > (entry.candidates[1]?.confidence ?? 0));
});

test("no fabricated Walmart grocery store offer remains in the catalog", () => {
  assert.equal(
    STORE_OFFER_RULES.some((rule) => rule.merchantId === "walmart"),
    false,
  );
});
