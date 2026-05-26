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
  profileForEmail,
  readStoredProfile,
  readStoredSession,
  type UserProfile,
  writeStoredProfile,
  writeStoredSession,
} from "@/lib/userProfile";

interface UserProfileContextValue {
  profile: UserProfile | null;
  hydrated: boolean;
  isLoggedIn: boolean;
  displayName: string;
  cardholderName: string;
  isOnWaitlist: boolean;
  joinWaitlist: (input: { name: string; email: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(readStoredProfile());
    setIsLoggedIn(Boolean(readStoredSession()));
    setHydrated(true);
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error("Enter a valid email address");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const match = profileForEmail(email);
    if (!match) {
      throw new Error("No account found — join the waitlist first");
    }

    writeStoredProfile(match);
    writeStoredSession({ email: match.email, loggedInAt: new Date().toISOString() });
    setProfile(match);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setIsLoggedIn(false);
  }, []);

  const joinWaitlist = useCallback(async (input: { name: string; email: string }) => {
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
      body: JSON.stringify({ name, email }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Could not join waitlist");
    }

    const joinedAt = new Date().toISOString();
    const next: UserProfile = { name, email, joinedAt };
    writeStoredProfile(next);
    appendWaitlistEntry({ name, email, at: joinedAt });
    writeStoredSession({ email, loggedInAt: joinedAt });
    setProfile(next);
    setIsLoggedIn(true);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      hydrated,
      isLoggedIn,
      displayName: displayName(profile?.name),
      cardholderName: cardholderLabel(profile?.name),
      isOnWaitlist: Boolean(profile),
      joinWaitlist,
      login,
      logout,
    }),
    [profile, hydrated, isLoggedIn, joinWaitlist, login, logout],
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
