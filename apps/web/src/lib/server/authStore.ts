import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type AuthUserRecord = {
  email: string;
  name: string;
  passwordSalt: string;
  passwordHash: string;
  verified: boolean;
  verificationCodeHash?: string;
  verificationCodeExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

type AuthStore = {
  users: Record<string, AuthUserRecord>;
};

const storeFilePath = path.join(process.cwd(), ".data", "auth-users.json");

async function ensureStore(): Promise<void> {
  await mkdir(path.dirname(storeFilePath), { recursive: true });
  try {
    await readFile(storeFilePath, "utf8");
  } catch {
    const initial: AuthStore = { users: {} };
    await writeFile(storeFilePath, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore(): Promise<AuthStore> {
  await ensureStore();
  const raw = await readFile(storeFilePath, "utf8");
  try {
    return JSON.parse(raw) as AuthStore;
  } catch {
    return { users: {} };
  }
}

async function writeStore(store: AuthStore): Promise<void> {
  await ensureStore();
  await writeFile(storeFilePath, JSON.stringify(store, null, 2), "utf8");
}

export async function getUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const store = await readStore();
  return store.users[email.toLowerCase()] ?? null;
}

export async function upsertUser(user: AuthUserRecord): Promise<void> {
  const store = await readStore();
  store.users[user.email.toLowerCase()] = user;
  await writeStore(store);
}
