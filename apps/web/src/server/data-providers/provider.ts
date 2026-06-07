import type {
  ConnectionStatusCode,
  LinkResult,
  LinkTokenResult,
  ProviderAccount,
  ProviderId,
  ProviderStatus,
  ProviderWebhookEvent,
  SyncResult,
} from "./types";

/**
 * The contract every bank-data provider implements. This is the anti-vendor-lock
 * moat: the rest of the app depends on THIS interface, never on Plaid (or any
 * future provider) directly. Swapping providers is a factory change, not a
 * rewrite.
 *
 * Read-only by construction. There is intentionally no method to move money,
 * initiate a transfer, or front a charge — that capability does not exist on
 * this layer and never will. OneCard advises; it never acts on the rails.
 */
export interface FinancialDataProvider {
  readonly id: ProviderId;

  /**
   * Begin a first-time account link. For Plaid this returns a `link_token` the
   * browser hands to Plaid Link; for the mock provider no token is needed.
   */
  createLinkToken(input: {
    userId: string;
    webhookUrl?: string;
  }): Promise<LinkTokenResult>;

  /**
   * Re-authenticate an EXISTING item after `login_required` (update-mode link).
   * This is the re-auth path most teams skip; without it, a credential change
   * silently kills sync and the user is lost. Returns a token for update-mode
   * Link, scoped to the item behind `accessToken`.
   */
  reauth(input: {
    userId: string;
    accessToken: string;
    webhookUrl?: string;
  }): Promise<LinkTokenResult>;

  /**
   * Exchange a client public token for a durable access token + the item's
   * accounts. The returned `accessToken` must be vaulted (encrypted) immediately.
   */
  linkAccount(input: { publicToken: string }): Promise<LinkResult>;

  /** Incremental, cursor-based transaction sync. Idempotent on `cursor`. */
  syncTransactions(input: {
    accessToken: string;
    cursor?: string;
  }): Promise<SyncResult>;

  /** Current accounts for an item (safe metadata only). */
  getAccounts(input: { accessToken: string }): Promise<ProviderAccount[]>;

  /** Live health probe for an item. */
  status(input: { accessToken: string }): Promise<ProviderStatus>;

  /**
   * Verify a webhook's signature and parse it into a neutral event. Returns
   * `null` when the signature is invalid or the payload is malformed — callers
   * MUST treat `null` as "reject". Verification is provider-specific (Plaid signs
   * an ES256 JWT over the body); the neutral event it produces is not.
   */
  verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<ProviderWebhookEvent | null>;
}

/**
 * Normalised provider error. Providers map their SDK errors into this so the
 * reliability layer can react uniformly:
 *  - `retryable` + `retryAfterMs` drive backoff (rate limits / product-not-ready).
 *  - `status` is the connection-health transition to apply (e.g. login_required).
 */
export class ProviderError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
  readonly status: ConnectionStatusCode;

  constructor(input: {
    message: string;
    code: string;
    retryable?: boolean;
    retryAfterMs?: number;
    status?: ConnectionStatusCode;
  }) {
    super(input.message);
    this.name = "ProviderError";
    this.code = input.code;
    this.retryable = input.retryable ?? false;
    this.retryAfterMs = input.retryAfterMs;
    this.status = input.status ?? "error";
  }
}

/** Raised when a provider is selected but not configured (e.g. missing keys). */
export class ProviderNotConfiguredError extends ProviderError {
  constructor(message: string) {
    super({ message, code: "provider_not_configured", retryable: false, status: "error" });
    this.name = "ProviderNotConfiguredError";
  }
}
