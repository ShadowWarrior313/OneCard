import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertStripeTestMode, StripeTestModeError } from "./assertStripeTestMode.ts";

describe("assertStripeTestMode", () => {
  it("allows explicit Stripe test-mode secret keys", () => {
    assert.doesNotThrow(() => assertStripeTestMode("sk_test_51ExampleKeyForUnitTests"));
  });

  it("rejects live-mode secret keys", () => {
    assert.throws(
      () => assertStripeTestMode("sk_live_51ExampleKeyWouldChargeRealMoney"),
      StripeTestModeError,
    );
  });

  it("rejects missing, blank, or non-secret keys", () => {
    assert.throws(() => assertStripeTestMode(undefined), StripeTestModeError);
    assert.throws(() => assertStripeTestMode(""), StripeTestModeError);
    assert.throws(() => assertStripeTestMode("   "), StripeTestModeError);
    assert.throws(() => assertStripeTestMode("pk_test_publishable"), StripeTestModeError);
    assert.throws(() => assertStripeTestMode("rk_live_restricted"), StripeTestModeError);
  });
});
