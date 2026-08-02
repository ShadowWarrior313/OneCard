import "server-only";

import { getDataProvider, ProviderError } from "@/server/data-providers";
import type { ProviderAccount, ProviderId, ProviderTransaction } from "@/server/data-providers/types";
import { withRetry } from "@/server/data-providers/retry";
import { decryptAccessToken, encryptAccessToken } from "@/server/data-providers/token-vault";
import { logProviderWarning } from "@/server/log";
import { categorizeTransaction } from "@/server/rewards-intel/categorize";
import { createHubId, mutateHubStore, readHubStore } from "@/data/store";
import type { HubStore, HubTransaction, LinkedAccount, LinkedItem } from "@/data/schema";

/**
 * Provider-neutral persistence + sync orchestration.
 *
 * This module sits ABOVE the provider. The provider returns neutral accounts +
 * transactions; here we (1) run every transaction through the MCC engine to
 * derive the reward category (we never trust the provider's category), (2)
 * persist safe records, and (3) drive connection-health transitions + backoff.
 */

function accountRecord(
  userId: string,
  itemId: string,
  account: ProviderAccount,
  existing?: LinkedAccount,
): LinkedAccount {
  return {
    id: existing?.id ?? createHubId("acct"),
    userId,
    itemId,
    providerAccountId: account.providerAccountId,
    name: account.name,
    officialName: account.officialName,
    mask: account.mask,
    type: account.type,
    subtype: account.subtype,
    trackedCardId: existing?.trackedCardId,
  };
}

function upsertAccounts(
  store: HubStore,
  userId: string,
  itemId: string,
  accounts: ProviderAccount[],
): void {
  for (const account of accounts) {
    const index = store.accounts.findIndex(
      (candidate) =>
        candidate.userId === userId &&
        candidate.itemId === itemId &&
        candidate.providerAccountId === account.providerAccountId,
    );
    const next = accountRecord(userId, itemId, account, store.accounts[index]);
    if (index === -1) store.accounts.push(next);
    else store.accounts[index] = next;
  }
}

function transactionRecord(
  store: HubStore,
  userId: string,
  transaction: ProviderTransaction,
  existing?: HubTransaction,
): HubTransaction {
  const account = store.accounts.find(
    (candidate) =>
      candidate.userId === userId &&
      candidate.providerAccountId === transaction.providerAccountId,
  );
  return {
    id: existing?.id ?? createHubId("txn"),
    userId,
    accountId: account?.id,
    providerTransactionId: transaction.providerTransactionId,
    source: "provider",
    merchantName: transaction.merchantName,
    amount: transaction.amount,
    date: transaction.date,
    pending: transaction.pending,
    currency: transaction.isoCurrencyCode ?? "CAD",
    paymentChannel: transaction.paymentChannel,
    providerCategoryHint: transaction.providerCategoryHint,
    website: transaction.website,
    // The MCC engine is the source of truth — the provider's hint is only a hint.
    categorized: categorizeTransaction({
      merchantName: transaction.merchantName,
      website: transaction.website,
      paymentChannel: transaction.paymentChannel,
      providerCategoryHint: transaction.providerCategoryHint,
    }),
  };
}

function applyTransactions(
  store: HubStore,
  userId: string,
  added: ProviderTransaction[],
  modified: ProviderTransaction[],
  removedIds: string[],
): void {
  for (const transaction of [...added, ...modified]) {
    const index = store.transactions.findIndex(
      (candidate) =>
        candidate.userId === userId &&
        candidate.providerTransactionId === transaction.providerTransactionId,
    );
    const next = transactionRecord(store, userId, transaction, store.transactions[index]);
    if (index === -1) store.transactions.push(next);
    else store.transactions[index] = next;
  }
  const removed = new Set(removedIds);
  store.transactions = store.transactions.filter(
    (transaction) =>
      transaction.userId !== userId ||
      !transaction.providerTransactionId ||
      !removed.has(transaction.providerTransactionId),
  );
}

export async function saveLinkedItem(input: {
  userId: string;
  provider: ProviderId;
  providerItemId: string;
  accessToken: string;
  institutionName: string;
  accounts: ProviderAccount[];
}): Promise<LinkedItem> {
  return mutateHubStore((store) => {
    const existing = store.items.find(
      (item) => item.userId === input.userId && item.providerItemId === input.providerItemId,
    );
    const item: LinkedItem = {
      id: existing?.id ?? createHubId("item"),
      userId: input.userId,
      provider: input.provider,
      providerItemId: input.providerItemId,
      encryptedAccessToken: encryptAccessToken(input.accessToken),
      institutionName: input.institutionName || existing?.institutionName || "Linked institution",
      cursor: existing?.cursor,
      lastSyncedAt: existing?.lastSyncedAt,
      status: "healthy",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (existing) Object.assign(existing, item);
    else store.items.push(item);
    upsertAccounts(store, input.userId, item.id, input.accounts);
    return item;
  });
}

/**
 * Incrementally sync one item. Backoff for transient errors is handled by
 * `withRetry`; a terminal error transitions connection health (login_required /
 * error) WITHOUT discarding last-known data — we never present stale as live.
 */
export async function syncLinkedItem(itemId: string): Promise<void> {
  const store = await readHubStore();
  const item = store.items.find((candidate) => candidate.id === itemId);
  if (!item) return;
  // Always sync through the provider that owns this item — never the process-wide
  // DATA_PROVIDER default. A mis-set env must fail closed, not rewrite the item
  // with another provider's accounts/cursors.
  const provider = getDataProvider(item.provider);
  const accessToken = decryptAccessToken(item.encryptedAccessToken);

  try {
    const result = await withRetry(() =>
      provider.syncTransactions({ accessToken, cursor: item.cursor }),
    );
    await mutateHubStore((nextStore) => {
      const mutable = nextStore.items.find((candidate) => candidate.id === item.id);
      if (!mutable) return;
      upsertAccounts(nextStore, item.userId, item.id, result.accounts);
      applyTransactions(nextStore, item.userId, result.added, result.modified, result.removedIds);
      mutable.cursor = result.nextCursor;
      mutable.lastSyncedAt = new Date().toISOString();
      mutable.status = "healthy";
      mutable.errorCode = undefined;
    });
  } catch (error) {
    const status = error instanceof ProviderError ? error.status : "error";
    const code = error instanceof ProviderError ? error.code : "sync_failed";
    logProviderWarning("Item sync failed; preserving last-known data", code);
    await mutateHubStore((nextStore) => {
      const mutable = nextStore.items.find((candidate) => candidate.id === item.id);
      if (mutable) {
        mutable.status = status === "login_required" ? "login_required" : "error";
        mutable.errorCode = code;
      }
    });
  }
}

export async function syncUserItems(userId: string): Promise<void> {
  const items = (await readHubStore()).items.filter((item) => item.userId === userId);
  await Promise.all(items.map((item) => syncLinkedItem(item.id)));
}

/** Link a connection (exchange public token), persist it, and run an initial sync. */
export async function linkAndSync(input: {
  userId: string;
  publicToken: string;
}): Promise<void> {
  const provider = getDataProvider();
  const link = await provider.linkAccount({ publicToken: input.publicToken });
  const item = await saveLinkedItem({
    userId: input.userId,
    provider: provider.id,
    providerItemId: link.providerItemId,
    accessToken: link.accessToken,
    institutionName: link.institutionName,
    accounts: link.accounts,
  });
  await syncLinkedItem(item.id);
}

/** Decrypt the access token for an item the user owns (for update-mode re-auth). */
export async function accessTokenForUserItem(
  userId: string,
  itemId: string,
): Promise<string | undefined> {
  const item = await linkedItemForUser(userId, itemId);
  return item ? decryptAccessToken(item.encryptedAccessToken) : undefined;
}

/** Load a linked item the user owns (provider + vault metadata). */
export async function linkedItemForUser(
  userId: string,
  itemId: string,
): Promise<LinkedItem | undefined> {
  return (await readHubStore()).items.find(
    (candidate) => candidate.id === itemId && candidate.userId === userId,
  );
}
