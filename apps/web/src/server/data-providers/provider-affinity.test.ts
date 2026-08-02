import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getDataProvider, resolveProviderId } from "./index.ts";

const ORIGINAL_DATA_PROVIDER = process.env.DATA_PROVIDER;

afterEach(() => {
  if (ORIGINAL_DATA_PROVIDER === undefined) delete process.env.DATA_PROVIDER;
  else process.env.DATA_PROVIDER = ORIGINAL_DATA_PROVIDER;
});

describe("getDataProvider provider affinity", () => {
  it("defaults the active provider to mock when DATA_PROVIDER is unset", () => {
    delete process.env.DATA_PROVIDER;
    assert.equal(resolveProviderId(), "mock");
    assert.equal(getDataProvider().id, "mock");
  });

  it("returns the requested provider even when the env default differs", () => {
    process.env.DATA_PROVIDER = "mock";
    assert.equal(resolveProviderId(), "mock");
    assert.equal(getDataProvider("plaid").id, "plaid");
    assert.equal(getDataProvider("mock").id, "mock");
  });

  it("keeps the active provider on plaid when configured", () => {
    process.env.DATA_PROVIDER = "plaid";
    assert.equal(resolveProviderId(), "plaid");
    assert.equal(getDataProvider().id, "plaid");
  });
});
