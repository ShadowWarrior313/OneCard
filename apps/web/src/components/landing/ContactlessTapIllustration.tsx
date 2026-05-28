"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MerchantLogo } from "@/components/MerchantLogo";
import { merchantById } from "@/data/merchants";
import { categoryDisplayLabel } from "@/lib/tapDemoScenarios";
import { useUserProfile } from "@/context/UserProfileContext";
import type { RewardCategory } from "@onecard/shared-types";

const EASE = [0.22, 1, 0.36, 1] as const;

function ContactlessWaves() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-zinc-400" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M14 24c0-5.5 4.5-10 10-10M10 24c0-7.7 6.3-14 14-14M18 24c0-3.3 2.7-6 6-6"
      />
    </svg>
  );
}

export function ContactlessTapIllustration({
  amount,
  merchantId,
  merchantName,
  category,
  scenarioIndex = 0,
  scenarioCount = 1,
  onPrev,
  onNext,
  className = "",
}: {
  amount: string;
  merchantId: string;
  merchantName: string;
  category: RewardCategory;
  scenarioIndex?: number;
  scenarioCount?: number;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}) {
  const { cardholderName } = useUserProfile();
  const name = cardholderName.toUpperCase();
  const merchant = merchantById(merchantId);
  const categoryLabel = categoryDisplayLabel(category);

  return (
    <div
      className={`relative mx-auto flex w-full max-w-md flex-col items-center justify-center overflow-visible px-4 py-6 sm:py-8 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-zinc-100/80 to-zinc-50/40"
        aria-hidden
      />

      {/* Merchant context screen (above terminal) */}
      <div className="relative z-20 mb-3 w-[min(100%,15.5rem)] sm:mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={merchantId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden rounded-xl bg-white px-3 py-2.5 shadow-md ring-1 ring-zinc-200/90 sm:px-3.5 sm:py-3"
          >
            <div className="flex items-center gap-3">
              {merchant ? (
                <MerchantLogo merchant={merchant} size={40} className="shrink-0" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-500">
                  ?
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-ink">{merchantName}</p>
                <p className="text-xs capitalize text-brand-muted">{categoryLabel}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {scenarioCount > 1 && onPrev && onNext && (
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-brand-ink shadow-sm hover:bg-zinc-50"
              aria-label="Previous purchase example"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-1 items-center justify-center gap-1.5">
              {Array.from({ length: scenarioCount }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === scenarioIndex ? "w-5 bg-sky-600" : "w-1.5 bg-zinc-300"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-brand-ink shadow-sm hover:bg-zinc-50"
              aria-label="Next purchase example"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
        <p className="mt-1.5 text-center text-[0.65rem] text-brand-muted">
          Swipe to preview different purchases
        </p>
      </div>

      {/* POS terminal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative z-10 w-[min(100%,15.5rem)]"
      >
        <div className="rounded-[1.35rem] bg-white p-2.5 shadow-[0_20px_50px_rgba(15,23,42,0.12)] ring-1 ring-zinc-200/80 sm:p-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={amount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-xl bg-zinc-950 px-4 pb-5 pt-6 text-center sm:px-5 sm:pt-7"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-zinc-700">
                <ContactlessWaves />
              </div>
              <p className="mt-5 text-xs font-medium text-zinc-400">Total</p>
              <p className="mt-1 text-[1.65rem] font-bold tabular-nums tracking-tight text-white sm:text-[1.85rem]">
                {amount}
              </p>
              <p className="mt-4 text-[0.65rem] leading-snug text-zinc-500 sm:text-xs">
                Tap, insert or swipe to pay
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mx-auto -mt-0.5 h-2 w-[88%] rounded-b-xl bg-gradient-to-b from-zinc-200 to-zinc-300 shadow-inner" />
      </motion.div>

      {/* OneCard overlapping terminal */}
      <motion.div
        className="absolute right-[4%] top-[32%] z-20 w-[9.5rem] sm:right-[6%] sm:top-[34%] sm:w-[10.5rem]"
        style={{ rotate: 28, transformOrigin: "center center" }}
        initial={{ opacity: 0, x: 24, y: -12 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, -5, 0],
          rotate: [26, 30, 26],
        }}
        transition={{
          opacity: { duration: 0.45, delay: 0.15 },
          x: { duration: 0.5, delay: 0.15, ease: EASE },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
          rotate: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
        }}
      >
        <div
          className="aspect-[1.586/1] overflow-hidden rounded-[0.85rem] shadow-[0_18px_40px_rgba(14,116,144,0.35)] ring-1 ring-white/20"
          style={{
            background: "linear-gradient(135deg, #2d1f4e 0%, #1a1a1c 45%, #0f0f12 100%)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 via-transparent to-sky-500/10" />
          <div className="relative flex h-full min-h-0 flex-col p-3.5 text-white">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <div className="h-4 w-6 rounded-sm bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner" />
              <span className="text-[0.4rem] font-bold uppercase tracking-[0.18em] text-white/40">
                OneCard
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-center py-0.5">
              <p className="text-[0.45rem] font-medium uppercase tracking-wider text-white/45">
                Universal wallet
              </p>
              <p
                className={`mt-0.5 max-w-full font-bold text-balance leading-[1.2] ${
                  name.length > 16 ? "text-[0.5rem] tracking-[0.02em]" : "text-[0.58rem] tracking-wide"
                }`}
              >
                {name}
              </p>
            </div>
            <div className="flex shrink-0 justify-end gap-0.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
              <span className="-ml-1.5 h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.span
        className="absolute right-[22%] top-[38%] z-[15] h-12 w-12 rounded-full border border-sky-400/40 sm:top-[40%]"
        animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        aria-hidden
      />
    </div>
  );
}
