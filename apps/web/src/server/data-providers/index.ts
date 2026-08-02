import "server-only";

import type { FinancialDataProvider } from "./provider";
import type { ProviderId } from "./types";
import { MockProvider } from "./mock";
import { PlaidProvider } from "./plaid";

/**
 * Provider factory. The active provider is chosen by the `DATA_PROVIDER` env var
 * and the DEFAULT is `mock` — so a clean checkout runs end-to-end with NO
 * third-party keys, and CI/tests never touch the network. Set `DATA_PROVIDER=plaid`
 * (with PLAID_* keys) to use real Plaid Sandbox.
 *
 * This single function is the entire vendor-swap surface. Adding open banking /
 * MX / Finicity later means: implement `FinancialDataProvider`, add a branch here.
 */
const cached = new Map<ProviderId, FinancialDataProvider>();

export function resolveProviderId(): ProviderId {
  return process.env.DATA_PROVIDER?.trim().toLowerCase() === "plaid" ? "plaid" : "mock";
}

/**
 * Resolve a provider instance.
 *
 * When `id` is omitted, returns the *active* provider from `DATA_PROVIDER`
 * (default `mock`). Pass an explicit id when operating on an already-linked
 * item — sync/reauth must follow `LinkedItem.provider`, never the current env
 * default. Otherwise flipping `DATA_PROVIDER` (or leaving it unset so it falls
 * back to mock) would drive a Plaid item through the mock provider and upsert
 * sandbox accounts / cursors onto real linked data.
 */
export function getDataProvider(id?: ProviderId): FinancialDataProvider {
  const resolved = id ?? resolveProviderId();
  const existing = cached.get(resolved);
  if (existing) return existing;
  const instance: FinancialDataProvider =
    resolved === "plaid" ? new PlaidProvider() : new MockProvider();
  cached.set(resolved, instance);
  return instance;
}

export type { FinancialDataProvider } from "./provider";
export { ProviderError, ProviderNotConfiguredError } from "./provider";
export type {
  ConnectionStatusCode,
  FreshnessState,
  LinkResult,
  LinkTokenResult,
  ProviderAccount,
  ProviderId,
  ProviderStatus,
  ProviderTransaction,
  ProviderWebhookEvent,
  SyncResult,
} from "./types";
