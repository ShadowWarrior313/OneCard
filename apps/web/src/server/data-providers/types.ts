/**
 * Provider-neutral domain types for OneCard's bank-data layer.
 *
 * STRATEGY: Plaid is plumbing — raw account/transaction data. OneCard owns the
 * decisions. To keep Plaid swappable (open banking / MX / Finicity later) and to
 * make testing trivial, NOTHING outside `data-providers/<provider>/` is allowed
 * to import a provider SDK or reference provider-specific shapes. Every provider
 * maps its own payloads INTO these neutral types, and the rest of the app only
 * ever sees these.
 *
 * TRUST: these types are deliberately read-only. There is no field, anywhere,
 * for a PAN, CVV, expiry, or any payment/transfer instruction. The data we carry
 * is transaction history + safe account metadata only.
 */

/** Which provider implementation is active. Add new providers here as built. */
export type ProviderId = "mock" | "plaid";

/**
 * Connection health for a single linked item (one bank login = one "item").
 *
 * This is the reliability model most teams skip. Plaid connections break —
 * especially at smaller banks — and `ITEM_LOGIN_REQUIRED` silently kills sync
 * when a user changes their bank credentials. We surface that state instead of
 * showing stale data as if it were live.
 *
 *  - `healthy`         — last sync succeeded and data is fresh.
 *  - `login_required`  — credentials changed / MFA expired; needs re-auth
 *                        (update-mode re-link). Sync is paused until reconnected.
 *  - `error`           — a non-recoverable-by-user provider error.
 *  - `stale`           — last sync is older than the freshness threshold; data
 *                        is shown as last-known, never as live.
 */
export type ConnectionStatusCode = "healthy" | "login_required" | "error" | "stale";

/** How fresh the last successful sync is, relative to the freshness threshold. */
export type FreshnessState = "fresh" | "stale" | "never";

/** Safe, non-identifying account metadata. Never includes a card number. */
export interface ProviderAccount {
  /** Provider's opaque account id (not a card number; safe to persist). */
  providerAccountId: string;
  name: string;
  officialName?: string;
  /** Last 2–4 digits only, for display. NOT a PAN. */
  mask?: string;
  /** e.g. "credit", "depository". */
  type: string;
  subtype?: string;
}

/**
 * A single transaction in neutral form.
 *
 * `providerCategoryHint` is the provider's own generic budgeting category. It is
 * a HINT ONLY and is NEVER trusted as the reward category — OneCard re-derives
 * the reward category by running the merchant through the MCC engine. See
 * `server/hub/ingest.ts`.
 */
export interface ProviderTransaction {
  providerTransactionId: string;
  providerAccountId: string;
  merchantName: string;
  /** Positive = money out (a purchase). */
  amount: number;
  isoCurrencyCode?: string;
  /** YYYY-MM-DD. */
  date: string;
  pending: boolean;
  paymentChannel?: string;
  website?: string;
  /** Provider's coarse category. A hint for the MCC engine — never the answer. */
  providerCategoryHint?: string;
}

/** Result of asking a provider to start a Link / re-auth handshake. */
export interface LinkTokenResult {
  provider: ProviderId;
  /**
   * Present when the provider needs a client-side Link handshake (Plaid). Absent
   * for providers (like the mock) that can link without a browser widget.
   */
  linkToken?: string;
  /** `create` for first link, `update` for re-authenticating an existing item. */
  mode: "create" | "update";
}

/**
 * Result of exchanging a client public token for a durable connection.
 *
 * The `accessToken` is a long-lived provider credential. The caller MUST encrypt
 * it at rest immediately (see `token-vault.ts`) and never log or bundle it.
 */
export interface LinkResult {
  providerItemId: string;
  accessToken: string;
  institutionName: string;
  accounts: ProviderAccount[];
}

/** Result of an incremental, cursor-based transaction sync. */
export interface SyncResult {
  accounts: ProviderAccount[];
  added: ProviderTransaction[];
  modified: ProviderTransaction[];
  /** Provider transaction ids that were removed/voided. */
  removedIds: string[];
  /** Opaque cursor to persist and pass back on the next sync. */
  nextCursor?: string;
  /**
   * When true, more pages remain beyond this call's page budget. Callers should
   * persist `nextCursor` and invoke sync again (do not treat as an error).
   */
  hasMore?: boolean;
}

/** Live health probe for an item. */
export interface ProviderStatus {
  status: ConnectionStatusCode;
  /** Raw provider error code, kept for diagnostics (e.g. "ITEM_LOGIN_REQUIRED"). */
  errorCode?: string;
}

/** Neutral webhook event after signature verification + parsing. */
export interface ProviderWebhookEvent {
  /** Stable idempotency key for de-duplication. */
  id: string;
  providerItemId?: string;
  /**
   *  - `sync_available`    — new transactions are ready; trigger a sync.
   *  - `login_required`    — flip the item to `login_required`; surface reconnect.
   *  - `error`             — provider error on the item.
   *  - `pending_expiration`— credential will expire soon; prompt re-auth.
   *  - `unknown`           — recognised + verified, but not actionable here.
   */
  kind: "sync_available" | "login_required" | "error" | "pending_expiration" | "unknown";
  errorCode?: string;
}
