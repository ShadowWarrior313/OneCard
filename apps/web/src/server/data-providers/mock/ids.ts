/**
 * Stable per-user mock provider item id.
 *
 * Must stay unique per hub user: webhooks and status updates look up items by
 * `providerItemId` globally (`.find()`), so a shared id like `mock_item_default`
 * routes events to the wrong user's connection.
 */
export function mockProviderItemId(userId: string): string {
  const trimmed = userId.trim();
  if (!trimmed) {
    throw new Error("Mock provider requires a non-empty userId for linkAccount");
  }
  return `mock_item_${trimmed}`;
}
