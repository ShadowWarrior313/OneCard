import type { CategorizedTransaction } from "@/server/rewards-intel/categorize";
import type {
  ConnectionStatusCode,
  FreshnessState,
  ProviderId,
} from "@/server/data-providers/types";

/**
 * Hub persistence schema — provider-NEUTRAL by design.
 *
 * Fields are named `provider*`, never `plaid*`, because the data layer is
 * abstracted (see `server/data-providers`). Swapping Plaid for open banking
 * later does not touch this schema. We persist provider tokens (encrypted),
 * safe account metadata, and transaction records — never a PAN, CVV, or expiry.
 */
export type HubTransactionSource = "provider" | "manual";

export interface HubUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface EncryptedSecret {
  algorithm: "aes-256-gcm";
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface LinkedItem {
  id: string;
  userId: string;
  /** Which provider owns this connection. */
  provider: ProviderId;
  /** Provider's opaque item id (one bank login). */
  providerItemId: string;
  /** Provider access token, encrypted at rest. Server-only; never logged/bundled. */
  encryptedAccessToken: EncryptedSecret;
  institutionName: string;
  cursor?: string;
  lastSyncedAt?: string;
  /** Stored connection health. Freshness is derived on read, not stored. */
  status: ConnectionStatusCode;
  /** Last provider error code (diagnostics only; never a token/identifier). */
  errorCode?: string;
  createdAt: string;
}

export interface LinkedAccount {
  id: string;
  userId: string;
  itemId: string;
  providerAccountId: string;
  name: string;
  officialName?: string;
  mask?: string;
  type: string;
  subtype?: string;
  trackedCardId?: string;
}

export interface HubTransaction {
  id: string;
  userId: string;
  accountId?: string;
  providerTransactionId?: string;
  source: HubTransactionSource;
  trackedCardId?: string;
  merchantName: string;
  amount: number;
  date: string;
  pending: boolean;
  currency: string;
  paymentChannel?: string;
  /** Provider's coarse category — a HINT only; never the reward category. */
  providerCategoryHint?: string;
  website?: string;
  /** Reward category as decided by the MCC engine (the value Plaid won't build). */
  categorized: CategorizedTransaction;
}

export interface SubTrackerRecord {
  id: string;
  userId: string;
  cardId: string;
  minimumSpend: number;
  startedAt: string;
  deadline: string;
}

/**
 * Webhook idempotency ledger. A verified webhook id is recorded once; replays
 * (Plaid retries the same body) are no-ops. Trimmed to a bounded window.
 */
export interface WebhookReceipt {
  id: string;
  receivedAt: string;
}

export interface HubStore {
  users: HubUser[];
  items: LinkedItem[];
  accounts: LinkedAccount[];
  transactions: HubTransaction[];
  subTrackers: SubTrackerRecord[];
  webhookReceipts: WebhookReceipt[];
}

/** Safe item view exposed to the client: status + freshness, never a token. */
export interface SafeLinkedItem {
  id: string;
  provider: ProviderId;
  institutionName: string;
  status: ConnectionStatusCode;
  freshness: FreshnessState;
  /** True when the user must re-authenticate (update-mode re-link). */
  needsReauth: boolean;
  /** Short, identifier-free status message for display. */
  message: string;
  lastSyncedAt?: string;
}

export interface SafeLinkedAccount {
  id: string;
  itemId: string;
  name: string;
  officialName?: string;
  mask?: string;
  type: string;
  subtype?: string;
  trackedCardId?: string;
}

export interface HubDashboardData {
  items: SafeLinkedItem[];
  accounts: SafeLinkedAccount[];
  transactions: SafeHubTransaction[];
  subTrackers: SafeSubTrackerRecord[];
}

export type SafeHubTransaction = Omit<HubTransaction, "userId" | "providerTransactionId">;
export type SafeSubTrackerRecord = Omit<SubTrackerRecord, "userId">;
