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
  cardholderLabel,
  displayName,
  normalizeProfileName,
  readStoredPersonalDetails,
  type PersonalDetails,
  type UserProfile,
  DEFAULT_PERSONAL_DETAILS,
  writeStoredPersonalDetails,
} from "@/lib/userProfile";

interface UserProfileContextValue {
  profile: UserProfile | null;
  personalDetails: PersonalDetails;
  hydrated: boolean;
  isLoggedIn: boolean;
  displayName: string;
  cardholderName: string;
  isOnWaitlist: boolean;
  signupStart: (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ delivery: "smtp" | "log"; deliveryReason?: "provider_unset" | "postmark_pending_approval" }>;
  verifySignupCode: (input: { email: string; code: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  updatePersonalDetails: (patch: Partial<PersonalDetails>) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>(
    DEFAULT_PERSONAL_DETAILS,
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPersonalDetails(readStoredPersonalDetails());
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          setProfile(null);
          setIsLoggedIn(false);
          return;
        }
        const data = (await res.json()) as { user?: UserProfile };
        if (data.user?.email) {
          setProfile(data.user);
          setIsLoggedIn(true);
        } else {
          setProfile(null);
          setIsLoggedIn(false);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  const signupStart = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      const name = normalizeProfileName(input.name);
      const email = input.email.trim().toLowerCase();
      const password = input.password;
      const confirmPassword = input.confirmPassword;

      if (name.length < 2) {
        throw new Error("Enter your full name");
      }
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error("Enter a valid email address");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const res = await fetch("/api/auth/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        delivery?: "smtp" | "log";
        deliveryReason?: "provider_unset" | "postmark_pending_approval";
      };
      if (!res.ok) throw new Error(data.error ?? "Could not start signup");
      return { delivery: data.delivery ?? "log", deliveryReason: data.deliveryReason };
    },
    [],
  );

  const verifySignupCode = useCallback(async (input: { email: string; code: string }) => {
    const email = input.email.trim().toLowerCase();
    const code = input.code.trim();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || !code.match(/^\d{6}$/)) {
      throw new Error("Enter a valid email and 6-digit code");
    }

    const res = await fetch("/api/auth/signup/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      user?: UserProfile;
    };
    if (!res.ok || !data.user) {
      throw new Error(data.error ?? "Could not verify code");
    }
    setProfile(data.user);
    setIsLoggedIn(true);
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      user?: UserProfile;
    };
    if (!res.ok || !data.user) {
      throw new Error(data.error ?? "Could not log in");
    }
    setProfile(data.user);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    void fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    setProfile(null);
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
      cardholderName: cardholderLabel(profile?.name),
      isOnWaitlist: Boolean(profile),
      signupStart,
      verifySignupCode,
      login,
      logout,
      updatePersonalDetails,
    }),
    [profile, personalDetails, hydrated, isLoggedIn, signupStart, verifySignupCode, login, logout, updatePersonalDetails],
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
