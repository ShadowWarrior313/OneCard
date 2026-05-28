"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactlessTapIllustration } from "@/components/landing/ContactlessTapIllustration";
import { useWallet } from "@/context/WalletContext";
import {
  buildRoutingRowsForScenario,
  formatCad,
  TAP_DEMO_SCENARIOS,
  type RoutingRow,
} from "@/lib/tapDemoScenarios";

const EASE = [0.22, 1, 0.36, 1] as const;

const CHECKLIST = [
  "One physical OneCard at every terminal",
  "MCC-aware routing to your best earn rate",
  "Rewards still post on your linked accounts",
  "Contactless, chip, and swipe supported",
];

export type { RoutingRow };

export function TapOnceExpandModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { cards } = useWallet();
  const [scenarioIndex, setScenarioIndex] = useState(0);

  const scenario = TAP_DEMO_SCENARIOS[scenarioIndex] ?? TAP_DEMO_SCENARIOS[0]!;
  const { rows, merchantName, category } = useMemo(
    () => buildRoutingRowsForScenario(cards, scenario),
    [cards, scenario],
  );

  const winner = rows.find((r) => r.win) ?? rows[0];
  const runner = rows.find((r) => !r.win);
  const amountLabel = formatCad(scenario.amount);

  const goPrev = useCallback(() => {
    setScenarioIndex((i) => (i - 1 + TAP_DEMO_SCENARIOS.length) % TAP_DEMO_SCENARIOS.length);
  }, []);

  const goNext = useCallback(() => {
    setScenarioIndex((i) => (i + 1) % TAP_DEMO_SCENARIOS.length);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, goPrev, goNext]);

  useEffect(() => {
    if (open) setScenarioIndex(0);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tap-once-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-brand-ink/55 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close"
          />

          <motion.div
            className="relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-brand-ink hover:bg-violet-100 sm:right-5 sm:top-5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto">
              <div className="grid gap-6 border-b border-zinc-100 px-5 py-6 sm:grid-cols-[1fr_minmax(0,16rem)] sm:px-8 sm:py-8">
                <div className="min-w-0 pr-10 sm:pr-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Universal wallet
                  </p>
                  <h2
                    id="tap-once-modal-title"
                    className="mt-2 text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl"
                  >
                    Tap once with OneCard everywhere
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-muted">
                    Carry one card. At checkout we read the merchant category and charge the linked
                    card that earns the most — you still collect rewards on your existing accounts.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/how-it-works"
                      onClick={onClose}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#635bff] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5851e6]"
                    >
                      See how it works
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/get-started"
                      onClick={onClose}
                      className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-zinc-50"
                    >
                      Get started
                    </Link>
                  </div>
                </div>
                <ul className="space-y-2.5 text-sm text-brand-body">
                  {CHECKLIST.map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" strokeWidth={2.5} />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100/90 via-sky-50 to-slate-50 ring-1 ring-violet-100/80">
                  <ContactlessTapIllustration
                    className="min-h-[320px] sm:min-h-[360px]"
                    amount={amountLabel}
                    merchantId={scenario.merchantId}
                    merchantName={merchantName}
                    category={category}
                    scenarioIndex={scenarioIndex}
                    scenarioCount={TAP_DEMO_SCENARIOS.length}
                    onPrev={goPrev}
                    onNext={goNext}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${scenario.id}-reward`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-1 flex-col justify-center rounded-2xl bg-gradient-to-br from-orange-50 via-white to-orange-100/60 px-6 py-8 text-center ring-1 ring-orange-100/80"
                    >
                      <p className="text-4xl font-bold tracking-tight text-orange-500 sm:text-5xl">
                        {winner?.reward ?? "$0.00"}
                      </p>
                      <p className="mx-auto mt-3 max-w-[15rem] text-sm leading-relaxed text-brand-body">
                        estimated rewards on a {formatCad(scenario.amount)}{" "}
                        <span className="font-semibold text-brand-ink">{merchantName}</span> purchase
                        with{" "}
                        <span className="font-semibold text-brand-ink">
                          {winner?.name ?? "your best card"}
                        </span>
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${scenario.id}-routing`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, delay: 0.04 }}
                      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/90 sm:p-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-brand-ink">Live routing</p>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700">
                          {cards.length > 0 ? `${cards.length} cards linked` : "Demo wallet"}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {rows.map((row) => (
                          <li
                            key={`${scenario.id}-${row.name}`}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                              row.win
                                ? "bg-emerald-50 ring-1 ring-emerald-200/70"
                                : "bg-zinc-50 ring-1 ring-zinc-100"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-brand-ink">{row.name}</p>
                              <p className="text-brand-muted">{row.rate}</p>
                            </div>
                            <p
                              className={`font-bold tabular-nums ${
                                row.win ? "text-emerald-700" : "text-brand-muted"
                              }`}
                            >
                              {row.reward}
                            </p>
                          </li>
                        ))}
                      </ul>
                      {runner && winner && (
                        <p className="mt-3 text-[0.7rem] leading-relaxed text-brand-muted">
                          OneCard routes {merchantName} to {winner.name} instead of {runner.name} at
                          tap time.
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
