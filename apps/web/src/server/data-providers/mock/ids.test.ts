import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockProviderItemId } from "./ids.ts";

describe("mockProviderItemId", () => {
  it("derives a distinct stable id per hub user", () => {
    const a = mockProviderItemId("user_aaa");
    const b = mockProviderItemId("user_bbb");
    assert.equal(a, "mock_item_user_aaa");
    assert.equal(b, "mock_item_user_bbb");
    assert.notEqual(a, b);
  });

  it("is stable across reconnects for the same user", () => {
    assert.equal(mockProviderItemId("user_reconnect"), mockProviderItemId("user_reconnect"));
  });

  it("rejects empty user ids so callers cannot fall back to a shared default", () => {
    assert.throws(() => mockProviderItemId(""), /non-empty userId/);
    assert.throws(() => mockProviderItemId("   "), /non-empty userId/);
  });

  it("never returns the historical shared collision id", () => {
    assert.notEqual(mockProviderItemId("anyone"), "mock_item_default");
  });
});
