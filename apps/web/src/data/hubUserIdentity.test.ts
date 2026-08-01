import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { upsertHubUserByEmail, type HubUserIdentity } from "./hubUserIdentity.ts";

describe("upsertHubUserByEmail", () => {
  it("keeps the same user id across repeated upserts (secret-rotation safe)", () => {
    const users: HubUserIdentity[] = [];
    let next = 0;
    const createId = () => `user_${++next}`;

    const first = upsertHubUserByEmail(
      users,
      { email: "Ada@Example.com", name: "Ada" },
      createId,
      () => "2026-01-01T00:00:00.000Z",
    );
    const afterRotation = upsertHubUserByEmail(
      users,
      { email: "ada@example.com", name: "Ada Lovelace" },
      createId,
      () => "2026-08-01T00:00:00.000Z",
    );

    assert.equal(first.id, "user_1");
    assert.equal(afterRotation.id, "user_1");
    assert.equal(users.length, 1);
    assert.equal(users[0]?.name, "Ada Lovelace");
    assert.equal(users[0]?.email, "ada@example.com");
    assert.equal(next, 1);
  });

  it("assigns distinct ids for distinct emails", () => {
    const users: HubUserIdentity[] = [];
    let next = 0;
    const a = upsertHubUserByEmail(users, { email: "a@x.com", name: "A" }, () => `user_${++next}`);
    const b = upsertHubUserByEmail(users, { email: "b@x.com", name: "B" }, () => `user_${++next}`);
    assert.notEqual(a.id, b.id);
    assert.equal(users.length, 2);
  });
});
