export const PROFILE_STORAGE_KEY = "onecard_profile_v1";
export const WAITLIST_STORAGE_KEY = "onecard_waitlist";
export const SESSION_STORAGE_KEY = "onecard_session_v1";

export interface UserProfile {
  name: string;
  email: string;
  joinedAt: string;
}

export interface UserSession {
  email: string;
  loggedInAt: string;
}

export interface WaitlistEntry {
  email: string;
  name: string;
  at: string;
}

export const DEFAULT_CARDHOLDER_NAME = "Alex Chen";

export function normalizeProfileName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function cardholderLabel(name: string | null | undefined): string {
  const trimmed = normalizeProfileName(name ?? "");
  if (!trimmed) return DEFAULT_CARDHOLDER_NAME.toUpperCase();
  return trimmed.toUpperCase();
}

export function displayName(name: string | null | undefined): string {
  const trimmed = normalizeProfileName(name ?? "");
  return trimmed || DEFAULT_CARDHOLDER_NAME;
}

export function readStoredProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed.name?.trim() || !parsed.email?.trim()) return null;
    return {
      name: normalizeProfileName(parsed.name),
      email: parsed.email.trim().toLowerCase(),
      joinedAt: parsed.joinedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeStoredProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function readStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (!parsed.email?.trim()) return null;
    return {
      email: parsed.email.trim().toLowerCase(),
      loggedInAt: parsed.loggedInAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeStoredSession(session: UserSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function profileForEmail(email: string): UserProfile | null {
  const normalized = email.trim().toLowerCase();
  const profile = readStoredProfile();
  if (profile?.email === normalized) return profile;
  const entry = readWaitlistEntries().find(
    (item) => item.email.toLowerCase() === normalized,
  );
  if (!entry) return null;
  return {
    name: normalizeProfileName(entry.name),
    email: entry.email.toLowerCase(),
    joinedAt: entry.at,
  };
}

export function appendWaitlistEntry(entry: WaitlistEntry): void {
  const list = readWaitlistEntries();
  if (list.some((x) => x.email.toLowerCase() === entry.email.toLowerCase())) {
    return;
  }
  list.push(entry);
  localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(list));
}

export function readWaitlistEntries(): WaitlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(WAITLIST_STORAGE_KEY) ?? "[]",
    ) as WaitlistEntry[];
  } catch {
    return [];
  }
}
