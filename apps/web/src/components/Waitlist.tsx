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
    <section id="waitlist" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <p className="text-sm font-medium text-emerald-400">
                Early access — Canada first
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Get your OneCard
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
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

            <div className="bg-slate-800/50 p-8 sm:p-12">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center text-center"
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
                      className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                        className="w-full rounded-xl border border-slate-600 bg-slate-900/80 py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-semibold text-slate-900 transition hover:bg-emerald-400"
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
