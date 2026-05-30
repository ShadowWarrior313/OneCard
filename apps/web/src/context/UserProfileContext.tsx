"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  appendWaitlistEntry,
  cardholderLabel,
  clearStoredSession,
  displayName,
  normalizeProfileName,
  readStoredPersonalDetails,
  readStoredProfile,
  readStoredSession,
  type PersonalDetails,
  type UserProfile,
  DEFAULT_PERSONAL_DETAILS,
  writeStoredPersonalDetails,
  writeStoredProfile,
  writeStoredSession,
} from "@/lib/userProfile";

interface UserProfileContextValue {
  profile: UserProfile | null;
  personalDetails: PersonalDetails;
  hydrated: boolean;
  isLoggedIn: boolean;
  displayName: string;
  cardholderName: string;
  isOnWaitlist: boolean;
  joinWaitlist: (input: { name: string; email: string }) => Promise<void>;
  login: (input: { name: string; email: string }) => Promise<void>;
  logout: () => void;
  updatePersonalDetails: (patch: Partial<PersonalDetails>) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

async function saveProfile(
  input: { name: string; email: string },
  source = "get-started",
): Promise<UserProfile> {
  const name = normalizeProfileName(input.name);
  const email = input.email.trim().toLowerCase();

  if (name.length < 2) {
    throw new Error("Enter your full name");
  }
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error("Enter a valid email address");
  }

  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, source }),
  });

  if (res.status === 503) {
    throw new Error("Waitlist opening soon");
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not save your profile");
  }

  const existing = readStoredProfile();
  const joinedAt =
    existing?.email === email ? (existing.joinedAt ?? new Date().toISOString()) : new Date().toISOString();

  const next: UserProfile = { name, email, joinedAt };
  writeStoredProfile(next);
  appendWaitlistEntry({ name, email, at: joinedAt });
  writeStoredSession({ email, loggedInAt: new Date().toISOString() });
  return next;
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>(
    DEFAULT_PERSONAL_DETAILS,
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPersonalDetails(readStoredPersonalDetails());
    setProfile(readStoredProfile());
    setIsLoggedIn(Boolean(readStoredSession()));
    setHydrated(true);
  }, []);

  const login = useCallback(async (input: { name: string; email: string }) => {
    const next = await saveProfile(input);
    setProfile(next);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setIsLoggedIn(false);
  }, []);

  const joinWaitlist = useCallback(async (input: { name: string; email: string }) => {
    const next = await saveProfile(input);
    setProfile(next);
    setIsLoggedIn(true);
  }, []);

  const updatePersonalDetails = useCallback((patch: Partial<PersonalDetails>) => {
    setPersonalDetails((prev) => {
      const billingSameAsHome = patch.billingSameAsHome ?? prev.billingSameAsHome;
      const homeAddress = patch.homeAddress
        ? { ...prev.homeAddress, ...patch.homeAddress }
        : prev.homeAddress;

      let billingAddress = patch.billingAddress
        ? { ...prev.billingAddress, ...patch.billingAddress }
        : prev.billingAddress;

      if (billingSameAsHome) {
        billingAddress = { ...homeAddress };
      } else if (patch.billingSameAsHome === false && prev.billingSameAsHome) {
        billingAddress = { ...homeAddress };
      }

      const next: PersonalDetails = {
        ...prev,
        ...patch,
        homeAddress,
        billingAddress,
        billingSameAsHome,
      };
      writeStoredPersonalDetails(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      profile,
      personalDetails,
      hydrated,
      isLoggedIn,
      displayName: displayName(profile?.name),
      cardholderName: cardholderLabel(isLoggedIn ? profile?.name : null),
      isOnWaitlist: Boolean(profile),
      joinWaitlist,
      login,
      logout,
      updatePersonalDetails,
    }),
    [profile, personalDetails, hydrated, isLoggedIn, joinWaitlist, login, logout, updatePersonalDetails],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}
