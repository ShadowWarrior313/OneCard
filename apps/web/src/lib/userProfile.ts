export const PROFILE_STORAGE_KEY = "onecard_profile_v1";
export const WAITLIST_STORAGE_KEY = "onecard_waitlist";
export const SESSION_STORAGE_KEY = "onecard_session_v1";
export const PERSONAL_DETAILS_STORAGE_KEY = "onecard_personal_details_v1";

export type Occupation =
  | "student"
  | "employee"
  | "entrepreneur"
  | "self_employed"
  | "retired"
  | "other";

export interface Address {
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface PersonalDetails {
  occupation: Occupation | "";
  homeAddress: Address;
  billingAddress: Address;
  billingSameAsHome: boolean;
}

export const EMPTY_ADDRESS: Address = {
  line1: "",
  line2: "",
  city: "",
  province: "",
  postalCode: "",
};

export const DEFAULT_PERSONAL_DETAILS: PersonalDetails = {
  occupation: "",
  homeAddress: { ...EMPTY_ADDRESS },
  billingAddress: { ...EMPTY_ADDRESS },
  billingSameAsHome: true,
};

export const OCCUPATION_LABELS: Record<Occupation, string> = {
  student: "Student",
  employee: "Employee",
  entrepreneur: "Entrepreneur",
  self_employed: "Self-employed",
  retired: "Retired",
  other: "Other",
};

export const CA_PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;

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

function normalizeAddress(raw: Partial<Address> | undefined): Address {
  return {
    line1: raw?.line1?.trim() ?? "",
    line2: raw?.line2?.trim() ?? "",
    city: raw?.city?.trim() ?? "",
    province: raw?.province?.trim() ?? "",
    postalCode: raw?.postalCode?.trim() ?? "",
  };
}

export function readStoredPersonalDetails(): PersonalDetails {
  if (typeof window === "undefined") return { ...DEFAULT_PERSONAL_DETAILS };
  try {
    const raw = localStorage.getItem(PERSONAL_DETAILS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERSONAL_DETAILS };
    const parsed = JSON.parse(raw) as Partial<PersonalDetails>;
    const homeAddress = normalizeAddress(parsed.homeAddress);
    const billingSameAsHome = parsed.billingSameAsHome ?? true;
    return {
      occupation: parsed.occupation ?? "",
      homeAddress,
      billingAddress: billingSameAsHome
        ? { ...homeAddress }
        : normalizeAddress(parsed.billingAddress),
      billingSameAsHome,
    };
  } catch {
    return { ...DEFAULT_PERSONAL_DETAILS };
  }
}

export function writeStoredPersonalDetails(details: PersonalDetails): void {
  localStorage.setItem(PERSONAL_DETAILS_STORAGE_KEY, JSON.stringify(details));
}
