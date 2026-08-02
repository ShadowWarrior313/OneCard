import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(path.join(webRoot, rel), "utf8");
}

describe("hub provider affinity (source)", () => {
  it("allows getDataProvider to take an explicit ProviderId", () => {
    const source = read("src/server/data-providers/index.ts");
    assert.match(source, /export function getDataProvider\(\s*id\?: ProviderId\)/);
  });

  it("syncs linked items through item.provider", () => {
    const source = read("src/server/hub/ingest.ts");
    const syncFn = source.match(
      /export async function syncLinkedItem\([\s\S]*?\nexport async function/,
    )?.[0];
    assert.ok(syncFn, "syncLinkedItem function not found");
    assert.match(syncFn, /getDataProvider\(\s*item\.provider\s*\)/);
    assert.doesNotMatch(syncFn, /getDataProvider\(\s*\)/);
  });

  it("reauths through item.provider", () => {
    const source = read("src/server/hub/routes.ts");
    assert.match(source, /getDataProvider\(\s*item\.provider\s*\)\.reauth/);
  });
});
