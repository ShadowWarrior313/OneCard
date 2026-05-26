"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useUserProfile } from "@/context/UserProfileContext";
import { OneCardLogo } from "@/components/OneCardLogo";

export function LoginForm() {
  const router = useRouter();
  const { profile, isLoggedIn, login, hydrated } = useUserProfile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.email) setEmail(profile.email);
  }, [profile?.email]);

  useEffect(() => {
    if (hydrated && isLoggedIn) {
      router.replace("/wallet");
    }
  }, [hydrated, isLoggedIn, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      router.push("/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="oc-panel mx-auto w-full max-w-md !rounded-[1.75rem] !p-8 sm:!p-10">
      <div className="mb-8 text-center">
        <OneCardLogo showWordmark />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-brand-ink">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Sign in to manage your wallet and run purchase simulations.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
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

        <div>
          <label htmlFor="login-password" className="text-sm font-medium text-brand-body">
            Password
          </label>
          <div className="relative mt-2">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
            <input
              id="login-password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="oc-input py-3 pl-11 pr-4"
            />
          </div>
          <p className="mt-2 text-xs text-brand-muted">
            Demo — any password with 6+ characters works.
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink py-3.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Log in"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        Don&apos;t have an account?{" "}
        <Link href="/#waitlist" className="font-semibold text-brand-purple hover:underline">
          Get started
        </Link>
      </p>
    </div>
  );
}
