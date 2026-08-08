import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { merchantById } from "./merchants.ts";

describe("merchant catalog category alignment", () => {
  it("does not force Costco warehouse spend into groceries", () => {
    const costco = merchantById("costco");
    assert.ok(costco);
    assert.equal(costco.mcc, "5300");
    assert.equal(costco.category, "other");
  });
});
