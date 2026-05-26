"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Sparkles,
  Store,
  Wallet,
  Zap,
} from "lucide-react";

const STEPS = [
  {
    id: "tap",
    icon: Store,
    title: "You tap OneCard",
    detail: "One physical card — same at every merchant",
    color: "bg-slate-100 text-slate-700",
  },
  {
    id: "read",
    icon: Zap,
    title: "We read the purchase",
    detail: "Merchant name + MCC category in milliseconds",
    color: "bg-amber-50 text-amber-800",
  },
  {
    id: "route",
    icon: Sparkles,
    title: "Engine picks your best card",
    detail: "Compares caps, multipliers & point values",
    color: "bg-emerald-50 text-emerald-800",
  },
  {
    id: "charge",
    icon: CreditCard,
    title: "Underlying card is charged",
    detail: "AMEX, CIBC, RBC… — invisible to the cashier",
    color: "bg-indigo-50 text-indigo-800",
  },
  {
    id: "earn",
    icon: Wallet,
    title: "You see what you earned",
    detail: "Rewards + why — not guesswork",
    color: "bg-slate-900 text-white",
  },
];

export function TransactionFlow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center sm:gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === active;
          const isPast = i < active;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : isPast
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Live example
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              $84.50 at Uber Eats
            </p>
            <p className="text-sm text-slate-500">MCC 5812 · Dining</p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-500">Your wallet</span>
                <span className="font-medium text-slate-700">4 cards linked</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-xl p-4 ${STEPS[active]?.color}`}
                >
                  <div className="flex items-start gap-3">
                    {STEPS[active] && (
                      <>
                        {(() => {
                          const Icon = STEPS[active].icon;
                          return <Icon className="mt-0.5 h-5 w-5 shrink-0" />;
                        })()}
                        <div>
                          <p className="font-semibold">{STEPS[active].title}</p>
                          <p className="mt-1 text-sm opacity-90">
                            {STEPS[active].detail}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-gradient-to-br from-slate-50 to-emerald-50/40 p-6">
            <motion.div
              key={active >= 2 ? "routed" : "pending"}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-xl border border-emerald-200/80 bg-white p-4 shadow-sm"
            >
              {active < 2 ? (
                <p className="text-sm text-slate-500">Routing in progress…</p>
              ) : (
                <>
                  <p className="text-xs font-medium text-emerald-600">
                    Optimal route
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    American Express Cobalt
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    5× MR on dining → ~$8.45 value
                  </p>
                  <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    +$6.76 vs using your default card on this purchase
                  </p>
                </>
              )}
            </motion.div>

            <div className="mt-4 flex gap-2">
              {["Cobalt", "Momentum", "Avion", "Scene+"].map((name, i) => (
                <div
                  key={name}
                  className={`flex-1 rounded-lg border px-2 py-2 text-center text-[10px] font-medium sm:text-xs ${
                    i === 0 && active >= 2
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white/60 text-slate-400"
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
