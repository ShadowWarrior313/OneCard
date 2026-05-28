"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, Mail, Shield, User } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useUserProfile } from "@/context/UserProfileContext";

export function Waitlist() {
  const { profile, signupStart, verifySignupCode, displayName } = useUserProfile();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"signup" | "verify" | "done">("signup");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"smtp" | "log" | null>(null);
  const [deliveryReason, setDeliveryReason] = useState<"provider_unset" | "postmark_pending_approval" | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setPhase("done");
    }
  }, [profile]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (phase === "signup") {
        const result = await signupStart({ name, email, password, confirmPassword });
        setDeliveryMode(result.delivery);
        setDeliveryReason(result.deliveryReason ?? null);
        setPhase("verify");
      } else if (phase === "verify") {
        await verifySignupCode({ email, code });
        setPhase("done");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="waitlist" className="oc-section bg-white">
      <div className="oc-container-wide">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-zinc-100 p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="oc-eyebrow">Waitlist open · Canada first</p>
              <h2 className="oc-heading mt-4 text-3xl sm:text-4xl">
                Get your OneCard
              </h2>
              <p className="mt-4 text-brand-muted leading-relaxed">
                Join for launch updates. One card for every purchase.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-brand-body">
                {[
                  "Connect every reward card you already own",
                  "Your name on your OneCard across the site",
                  "Live rewards simulator on this site",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-mint" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 sm:p-8">
              {phase === "done" ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-12 w-12 text-brand-mint" />
                  <h3 className="mt-4 text-xl font-semibold text-brand-ink">
                    Account ready, {displayName.split(" ")[0]}
                  </h3>
                  <p className="mt-2 text-sm text-brand-muted">
                    Your email is verified and your account is signed in on this device.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  {phase === "signup" ? (
                    <>
                      <div>
                        <label
                          htmlFor="name"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-body"
                        >
                          <User className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden />
                          Full name
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          minLength={2}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Smith"
                          className="oc-input mt-2 bg-brand-surface/50"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-sm font-medium text-brand-body">
                          Email
                        </label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
                          <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            className="oc-input bg-brand-surface/50 py-3 pl-11 pr-4"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="password" className="text-sm font-medium text-brand-body">
                          Set password
                        </label>
                        <div className="relative mt-2">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="oc-input bg-brand-surface/50 pr-12"
                            placeholder="At least 8 characters"
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
                      <div>
                        <label htmlFor="confirm-password" className="text-sm font-medium text-brand-body">
                          Confirm password
                        </label>
                        <div className="relative mt-2">
                          <input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="oc-input bg-brand-surface/50 pr-12"
                            placeholder="Re-enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label htmlFor="code" className="text-sm font-medium text-brand-body">
                        Enter 6-digit email code
                      </label>
                      <p className="mt-1 text-xs text-brand-muted">
                        Sent to <strong>{email}</strong>. Code expires in 10 minutes.
                      </p>
                      <input
                        id="code"
                        type="text"
                        required
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="123456"
                        className="oc-input mt-2 bg-brand-surface/50"
                      />
                      {deliveryMode === "log" && (
                        <p className="mt-2 text-xs text-amber-700">
                          {deliveryReason === "postmark_pending_approval"
                            ? "Postmark is configured but pending approval for external recipients. Use the code logged in the server for now."
                            : "Dev mode: no email provider configured, so the code is logged on server."}
                        </p>
                      )}
                    </div>
                  )}
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-ink py-3.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal disabled:opacity-60"
                  >
                    {submitting
                      ? phase === "signup"
                        ? "Creating account..."
                        : "Verifying..."
                      : phase === "signup"
                        ? "Create account"
                        : "Verify code"}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <p className="flex items-center justify-center gap-2 text-xs text-brand-muted">
                    <Shield className="h-3.5 w-3.5" />
                    Secure sign-in cookie keeps you logged in on this device
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
