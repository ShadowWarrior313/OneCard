"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, Shield, User } from "lucide-react";
import { FormEvent, useState } from "react";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Enter a valid email address");
      return;
    }
    const list = JSON.parse(
      localStorage.getItem("onecard_waitlist") ?? "[]",
    ) as { email: string; name: string; at: string }[];
    if (list.some((x) => x.email === email)) {
      setSubmitted(true);
      return;
    }
    list.push({ email, name, at: new Date().toISOString() });
    localStorage.setItem("onecard_waitlist", JSON.stringify(list));
    setSubmitted(true);
  }

  return (
    <section id="waitlist" className="oc-section bg-gradient-to-br from-brand-purple-soft/60 to-brand-ocean-soft/40">
      <div className="oc-container">
        <div className="oc-panel grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-8 !p-6 sm:!p-8">
          <div>
            <p className="oc-eyebrow">Early access — Canada</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">
              Get your OneCard
            </h2>
            <p className="mt-4 text-brand-muted leading-relaxed">
              Join the waitlist for launch updates. One card for every purchase.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-brand-body">
              {[
                "Link Amex & Big Six cards you already own",
                "Leather-style wallet with per-card tips",
                "Live rewards simulator on this site",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-mint" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[240px] flex-col items-center justify-center text-center"
              >
                <CheckCircle2 className="h-12 w-12 text-brand-mint" />
                <h3 className="mt-4 text-xl font-bold text-brand-ink">You&apos;re on the list</h3>
                <p className="mt-2 text-sm text-brand-muted">
                  We&apos;ll email you when OneCard opens in your region.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-body">
                    <User className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden />
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    className="oc-input mt-1 bg-slate-50"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-brand-body">
                    Email
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="oc-input bg-slate-50 py-3 pl-11 pr-4"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="oc-btn-primary w-full"
                >
                  Join waitlist
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
                <p className="flex items-center justify-center gap-2 text-xs text-brand-muted">
                  <Shield className="h-3.5 w-3.5" />
                  Demo — stored locally only
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
