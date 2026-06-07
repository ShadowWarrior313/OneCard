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
let cached: { id: ProviderId; instance: FinancialDataProvider } | undefined;

export function resolveProviderId(): ProviderId {
  return process.env.DATA_PROVIDER?.trim().toLowerCase() === "plaid" ? "plaid" : "mock";
}

export function getDataProvider(): FinancialDataProvider {
  const id = resolveProviderId();
  if (cached?.id === id) return cached.instance;
  const instance: FinancialDataProvider = id === "plaid" ? new PlaidProvider() : new MockProvider();
  cached = { id, instance };
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
