"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WaitlistFormSource =
  | "hero"
  | "card-section"
  | "get-started"
  | "how-it-works"
  | string;

type FormStatus = "idle" | "loading" | "success" | "error" | "unavailable";

export function WaitlistForm({
  source = "unknown",
  variant = "light",
  className = "",
  name,
  onSuccess,
  showSuccessInline = true,
}: {
  source?: WaitlistFormSource;
  variant?: "light" | "dark";
  className?: string;
  /** Optional name sent with the signup payload */
  name?: string;
  onSuccess?: (email: string) => void;
  /** When false, parent handles success UI via onSuccess */
  showSuccessInline?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled && data.configured === false) setStatus("unavailable");
      })
      .catch(() => {
        /* keep idle — submit will surface errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const trimmedName = name?.trim();
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source,
          ...(trimmedName && trimmedName.length >= 2 ? { name: trimmedName } : {}),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        unavailable?: boolean;
        error?: string;
      };

      if (res.status === 503 && data.unavailable) {
        setStatus("unavailable");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
      onSuccess?.(trimmed);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  const dark = variant === "dark";
  const inputClass = dark
    ? "oc-input min-h-[2.75rem] flex-1 border-zinc-700 bg-zinc-900/80 text-white placeholder:text-zinc-500"
    : "oc-input min-h-[2.75rem] flex-1 bg-white";
  const btnClass = dark
    ? "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-brand-ink hover:bg-zinc-100 disabled:opacity-60"
    : "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-ink px-4 py-3 text-sm font-semibold text-white hover:bg-brand-charcoal disabled:opacity-60";

  if (status === "unavailable") {
    const unavailableClass = dark
      ? "border-zinc-700 bg-zinc-900/60 text-zinc-400"
      : "border-zinc-200 bg-zinc-50 text-brand-muted";
    return (
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${unavailableClass} ${className}`.trim()}
        role="status"
      >
        Waitlist opening soon — check back shortly.
      </div>
    );
  }

  if (status === "success" && showSuccessInline) {
    return (
      <div
        className={`flex min-h-[2.75rem] items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ${className}`.trim()}
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
        You&apos;re on the list — we&apos;ll email you when it&apos;s ready.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`space-y-2 ${className}`.trim()} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`waitlist-email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`waitlist-email-${source}`}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@email.com"
          disabled={status === "loading"}
          className={inputClass}
        />
        <button type="submit" disabled={status === "loading"} className={btnClass}>
          {status === "loading" ? "Joining…" : "Join waitlist"}
          {status !== "loading" && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      {status === "error" && message && (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
