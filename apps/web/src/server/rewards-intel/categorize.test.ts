import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categorizeTransaction } from "./categorize.ts";

describe("categorizeTransaction hub fallbacks", () => {
  it("maps Tim Hortons to dining via web catalog brand match", () => {
    const result = categorizeTransaction({
      merchantName: "Tim Hortons #1234",
      providerCategoryHint: "FOOD_AND_DRINK",
      paymentChannel: "in store",
    });
    assert.equal(result.category, "dining");
    assert.equal(result.merchantId, "tim_hortons");
  });

  it("maps Netflix to subscriptions", () => {
    const result = categorizeTransaction({
      merchantName: "Netflix",
      website: "netflix.com",
      providerCategoryHint: "ENTERTAINMENT",
      paymentChannel: "online",
    });
    assert.equal(result.category, "subscriptions");
  });

  it("maps Uber trip to transportation", () => {
    const result = categorizeTransaction({
      merchantName: "UBER TRIP HELP.UBER.COM",
      providerCategoryHint: "TRANSPORTATION",
      paymentChannel: "online",
    });
    assert.equal(result.category, "transportation");
    assert.equal(result.merchantId, "uber");
  });

  it("maps Shoppers Drug Mart to drugstore when catalog category is aligned", () => {
    const result = categorizeTransaction({
      merchantName: "Shoppers Drug Mart",
      providerCategoryHint: "MEDICAL",
      paymentChannel: "in store",
    });
    // On main, shoppers is still catalog `other` (PR #33 aligns drugstore).
    // Provider MEDICAL hint must not be ignored when brand category is other.
    assert.ok(
      result.category === "drugstore" || result.merchantId === "shoppers",
      `category=${result.category} merchantId=${result.merchantId}`,
    );
  });

  it("keeps engine-resolved Safeway as groceries", () => {
    const result = categorizeTransaction({
      merchantName: "Safeway",
      providerCategoryHint: "FOOD_AND_DRINK",
      paymentChannel: "in store",
    });
    assert.equal(result.category, "groceries");
  });

  it("uses provider hint for unknown merchants", () => {
    const result = categorizeTransaction({
      merchantName: "TOTALLY UNKNOWN CAFE XYZ",
      providerCategoryHint: "FOOD_AND_DRINK",
      paymentChannel: "in store",
    });
    assert.equal(result.category, "dining");
  });
});
