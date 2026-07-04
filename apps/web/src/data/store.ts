import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  deriveStatus,
  freshnessFor,
  statusMessage,
} from "@/server/data-providers/connection-health";
import type { ConnectionStatusCode } from "@/server/data-providers/types";
import type {
  HubDashboardData,
  HubStore,
  HubUser,
  LinkedAccount,
  LinkedItem,
  SubTrackerRecord,
} from "./schema";

const STORE_PATH =
  process.env.HUB_DATA_PATH ?? path.join(process.cwd(), ".data", "hub-store.json");

/** Bound the idempotency ledger so it can't grow without limit. */
const MAX_WEBHOOK_RECEIPTS = 500;

const EMPTY_STORE: HubStore = {
  users: [],
  items: [],
  accounts: [],
  transactions: [],
  subTrackers: [],
  webhookReceipts: [],
};

let mutationQueue: Promise<void> = Promise.resolve();

function normalizeStore(raw: Partial<HubStore>): HubStore {
  return {
    users: raw.users ?? [],
    items: raw.items ?? [],
    accounts: raw.accounts ?? [],
    transactions: raw.transactions ?? [],
    subTrackers: raw.subTrackers ?? [],
    webhookReceipts: raw.webhookReceipts ?? [],
  };
}

export async function readHubStore(): Promise<HubStore> {
  try {
    return normalizeStore(
      JSON.parse(await readFile(STORE_PATH, "utf8")) as Partial<HubStore>,
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { ...EMPTY_STORE };
    throw error;
  }
}

async function writeHubStore(store: HubStore): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}

export async function mutateHubStore<T>(
  mutation: (store: HubStore) => T | Promise<T>,
): Promise<T> {
  let resolveResult!: (value: T | PromiseLike<T>) => void;
  let rejectResult!: (reason?: unknown) => void;
  const result = new Promise<T>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  mutationQueue = mutationQueue.catch(() => undefined).then(async () => {
    try {
      const store = await readHubStore();
      const value = await mutation(store);
      await writeHubStore(store);
      resolveResult(value);
    } catch (error) {
      rejectResult(error);
    }
  });

  await mutationQueue;
  return result;
}

export function createHubId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function ensureHubUser(input: {
  id: string;
  email: string;
  name: string;
}): Promise<HubUser> {
  return mutateHubStore((store) => {
    const existing = store.users.find((user) => user.id === input.id);
    if (existing) {
      existing.email = input.email;
      existing.name = input.name;
      return existing;
    }
    const user: HubUser = {
      ...input,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    return user;
  });
}

export async function findHubUser(userId: string): Promise<HubUser | undefined> {
  return (await readHubStore()).users.find((user) => user.id === userId);
}

export async function findItemByProviderItemId(
  providerItemId: string,
): Promise<LinkedItem | undefined> {
  return (await readHubStore()).items.find((item) => item.providerItemId === providerItemId);
}

/**
 * Check whether a verified webhook id has already completed handling.
 * Receipts are written after side effects so provider retries remain usable if
 * we crash or fail to persist during handling.
 */
export async function hasWebhookReceipt(id: string): Promise<boolean> {
  return (await readHubStore()).webhookReceipts.some((receipt) => receipt.id === id);
}

/** Record a verified webhook id after webhook side effects complete. */
export async function recordWebhookOnce(id: string): Promise<boolean> {
  return mutateHubStore((store) => {
    if (store.webhookReceipts.some((receipt) => receipt.id === id)) return false;
    store.webhookReceipts.push({ id, receivedAt: new Date().toISOString() });
    if (store.webhookReceipts.length > MAX_WEBHOOK_RECEIPTS) {
      store.webhookReceipts = store.webhookReceipts.slice(-MAX_WEBHOOK_RECEIPTS);
    }
    return true;
  });
}

/** Transition an item's stored health (e.g. webhook flags ITEM_LOGIN_REQUIRED). */
export async function setItemStatus(
  providerItemId: string,
  status: ConnectionStatusCode,
  errorCode?: string,
): Promise<void> {
  await mutateHubStore((store) => {
    const item = store.items.find((candidate) => candidate.providerItemId === providerItemId);
    if (!item) return;
    item.status = status;
    item.errorCode = errorCode;
  });
}

export async function dashboardForUser(userId: string): Promise<HubDashboardData> {
  const store = await readHubStore();
  const now = Date.now();
  return {
    items: store.items
      .filter((item) => item.userId === userId)
      .map((item) => {
        const status = deriveStatus({
          storedStatus: item.status,
          lastSyncedAt: item.lastSyncedAt,
          now,
        });
        return {
          id: item.id,
          provider: item.provider,
          institutionName: item.institutionName,
          status,
          freshness: freshnessFor(item.lastSyncedAt, now),
          needsReauth: status === "login_required",
          message: statusMessage(status),
          lastSyncedAt: item.lastSyncedAt,
        };
      }),
    accounts: store.accounts
      .filter((account) => account.userId === userId)
      .map(({ id, itemId, name, officialName, mask, type, subtype, trackedCardId }) => ({
        id,
        itemId,
        name,
        officialName,
        mask,
        type,
        subtype,
        trackedCardId,
      })),
    transactions: store.transactions
      .filter((transaction) => transaction.userId === userId)
      .map(
        ({ userId: _userId, providerTransactionId: _providerTransactionId, ...transaction }) =>
          transaction,
      ),
    subTrackers: store.subTrackers
      .filter((tracker) => tracker.userId === userId)
      .map(({ userId: _userId, ...tracker }) => tracker),
  };
}

export async function mapAccountToCard(
  userId: string,
  accountId: string,
  trackedCardId: string | undefined,
): Promise<LinkedAccount | undefined> {
  return mutateHubStore((store) => {
    const account = store.accounts.find(
      (candidate) => candidate.id === accountId && candidate.userId === userId,
    );
    if (!account) return undefined;
    account.trackedCardId = trackedCardId;
    return account;
  });
}

export async function upsertSubTracker(
  userId: string,
  tracker: Omit<SubTrackerRecord, "id" | "userId">,
): Promise<SubTrackerRecord> {
  return mutateHubStore((store) => {
    const existing = store.subTrackers.find(
      (candidate) => candidate.userId === userId && candidate.cardId === tracker.cardId,
    );
    if (existing) {
      Object.assign(existing, tracker);
      return existing;
    }
    const created = { id: createHubId("sub"), userId, ...tracker };
    store.subTrackers.push(created);
    return created;
  });
}
