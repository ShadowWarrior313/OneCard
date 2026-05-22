"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, Shield } from "lucide-react";
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
    <section id="waitlist" className="oc-section oc-waitlist">
      <div className="oc-container">
        <div className="oc-waitlist-card">
          <div className="oc-waitlist-grid">
            <div className="oc-waitlist-copy">
              <p className="text-sm font-medium text-emerald-400">
                Early access — Canada first
              </p>
              <h2 className="oc-section-title mt-3 text-white">
                Get your OneCard
              </h2>
              <p className="mt-4 leading-relaxed text-slate-300">
                One card for every purchase. We&apos;re building with the same
                simplicity you expect from Wise or Wealthsimple — join the
                waitlist for launch updates.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "No annual fee on OneCard itself (planned)",
                  "Link existing Amex & Big Six cards — keep your points",
                  "See every routing decision in plain English",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="oc-waitlist-form-panel">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full min-h-[280px] flex-col items-center justify-center text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">You&apos;re on the list</h3>
                  <p className="mt-2 text-slate-400">
                    We&apos;ll email you when OneCard opens in your region.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="text-sm text-slate-400">
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Chen"
                      className="oc-waitlist-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm text-slate-400">
                      Email
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="oc-waitlist-input oc-waitlist-input-with-icon"
                      />
                    </div>
                  </div>
                  {error && <p className="oc-form-error">{error}</p>}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="oc-btn oc-btn-accent flex items-center justify-center gap-2 py-3.5"
                  >
                    Join the waitlist
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                  <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Shield className="h-3.5 w-3.5" />
                    Demo only — stored locally, not sent to a server
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
