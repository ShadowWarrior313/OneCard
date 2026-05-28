"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Mail, User } from "lucide-react";
import { useUserProfile } from "@/context/UserProfileContext";
import { OneCardLogo } from "@/components/OneCardLogo";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoggedIn, login, hydrated } = useUserProfile();
  const nextPath = searchParams.get("next") || "/wallet";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.email) setEmail(profile.email);
  }, [profile?.name, profile?.email]);

  useEffect(() => {
    if (hydrated && isLoggedIn) {
      router.replace(nextPath);
    }
  }, [hydrated, isLoggedIn, router, nextPath]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ name, email });
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="oc-panel mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <OneCardLogo showWordmark />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-brand-ink">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Enter your name and email — your OneCard updates across the site.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-name" className="text-sm font-medium text-brand-body">
            Full name
          </label>
          <div className="relative mt-2">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
            <input
              id="login-name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className="oc-input py-3 pl-11 pr-4"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-email" className="text-sm font-medium text-brand-body">
            Email
          </label>
          <div className="relative mt-2">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="oc-input py-3 pl-11 pr-4"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink py-3.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        New here?{" "}
        <Link href="/get-started" className="font-semibold text-brand-ink hover:underline">
          Join the waitlist
        </Link>
      </p>
    </div>
  );
}
