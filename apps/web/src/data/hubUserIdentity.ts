/**
 * Pure hub-user upsert helpers (no I/O) so identity policy can be unit-tested
 * without pulling in the server-only store module.
 */

export interface HubUserIdentity {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/**
 * Upsert by normalized email, preserving the existing id. New users get a
 * caller-supplied id (random `user_…` in production). Identity must never be
 * derived from AUTH_SESSION_SECRET.
 */
export function upsertHubUserByEmail(
  users: HubUserIdentity[],
  input: { email: string; name: string },
  createId: () => string,
  nowIso: () => string = () => new Date().toISOString(),
): HubUserIdentity {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().replace(/\s+/g, " ");
  const existing = users.find((user) => user.email === email);
  if (existing) {
    existing.email = email;
    existing.name = name;
    return existing;
  }
  const user: HubUserIdentity = {
    id: createId(),
    email,
    name,
    createdAt: nowIso(),
  };
  users.push(user);
  return user;
}
