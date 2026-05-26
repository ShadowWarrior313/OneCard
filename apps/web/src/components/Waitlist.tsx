"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, Shield, User } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useUserProfile } from "@/context/UserProfileContext";

export function Waitlist() {
  const { profile, isOnWaitlist, joinWaitlist, displayName } = useUserProfile();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setSubmitted(true);
    }
  }, [profile]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await joinWaitlist({ name, email });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="waitlist" className="oc-section bg-brand-surface">
      <div className="oc-container-wide">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white shadow-lift"
        >
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-zinc-100 p-8 sm:p-10 lg:border-b-0 lg:border-r">
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

            <div className="p-8 sm:p-10">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[280px] flex-col items-center justify-center text-center"
                >
                  <CheckCircle2 className="h-12 w-12 text-brand-mint" />
                  <h3 className="mt-4 text-xl font-semibold text-brand-ink">
                    You&apos;re on the list, {displayName.split(" ")[0]}
                  </h3>
                  <p className="mt-2 text-sm text-brand-muted">
                    Your OneCard now shows <strong>{displayName}</strong> across
                    the demo.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
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
                      placeholder="Alex Chen"
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
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: submitting ? 1 : 1.01 }}
                    whileTap={{ scale: submitting ? 1 : 0.99 }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink py-3.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal disabled:opacity-60"
                  >
                    {submitting ? "Joining…" : "Join waitlist"}
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                  <p className="flex items-center justify-center gap-2 text-xs text-brand-muted">
                    <Shield className="h-3.5 w-3.5" />
                    Saved on this device · used for your card name
                  </p>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
