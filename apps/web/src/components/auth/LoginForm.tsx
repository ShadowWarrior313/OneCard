"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useUserProfile } from "@/context/UserProfileContext";
import { OneCardLogo } from "@/components/OneCardLogo";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoggedIn, login, hydrated } = useUserProfile();
  const nextPath = searchParams.get("next") || "/wallet";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.email) setEmail(profile.email);
  }, [profile?.email]);

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
      await login({ email, password });
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
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="oc-input py-3 pl-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
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
          {submitting ? "Signing in…" : "Log in"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        Don&apos;t have an account?{" "}
        <Link href="/get-started" className="font-semibold text-brand-ink hover:underline">
          Get started
        </Link>
      </p>
    </div>
  );
}
