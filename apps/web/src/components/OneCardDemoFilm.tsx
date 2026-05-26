"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import { OneCardLogo } from "./OneCardLogo";
import { useCallback, useEffect, useState, type CSSProperties } from "react";

type Phase = "idle" | "tap" | "scan" | "match" | "process" | "approved" | "reward";

const EASE = [0.32, 0.72, 0, 1] as const;
const FADE = { duration: 0.55, ease: EASE };

function cardBg(from: string, to: string): CSSProperties {
  return {
    background: `linear-gradient(145deg, ${from} 0%, ${to} 62%, ${to} 100%)`,
  };
}

const SCAN_CARDS = [
  { id: "scotia", short: "Momentum", issuer: "Scotiabank", from: "#EC111A", to: "#b80d14" },
  { id: "rbc", short: "ION", issuer: "RBC", from: "#3b82f6", to: "#0051A5" },
  { id: "cibc", short: "Dividend", issuer: "CIBC", from: "#8B1538", to: "#5c0d24" },
  { id: "td", short: "Cash Back", issuer: "TD", from: "#16a34a", to: "#14532d" },
];

const WINNER = {
  short: "Cobalt",
  issuer: "Amex",
  from: "#38bdf8",
  to: "#312e81",
};

const STRIP = [...SCAN_CARDS, { id: "amex", ...WINNER }];
const CARD_H = 52;
const WINNER_INDEX = STRIP.length - 1;

const PHASE_MS: Record<Phase, number> = {
  idle: 1800,
  tap: 1000,
  scan: 520 * STRIP.length + 800,
  match: 1400,
  process: 1500,
  approved: 2600,
  reward: 3000,
};

const STATUS: Record<Phase, string> = {
  idle: "Ready to tap",
  tap: "Reading chip…",
  scan: "Scanning your wallet…",
  match: "Best card found",
  process: "Routing payment…",
  approved: "Approved",
  reward: "5× rewards · Dining",
};

const CAPTIONS: Record<Phase, { title: string; sub: string }> = {
  idle: {
    title: "One card for every purchase",
    sub: "Link your Amex & Big Six cards once",
  },
  tap: {
    title: "Tap with OneCard",
    sub: "Same card at every merchant in Canada",
  },
  scan: {
    title: "We read the category",
    sub: "MCC matched to your linked wallet",
  },
  match: {
    title: "Amex Cobalt wins",
    sub: "5× on dining at Uber Eats",
  },
  process: {
    title: "Charged to Cobalt",
    sub: "You only tap OneCard — we route behind the scenes",
  },
  approved: {
    title: "Payment approved",
    sub: "Rewards post on your existing card",
  },
  reward: {
    title: "+$7.29 vs your default",
    sub: "More value on every optimized tap",
  },
};

const PHASE_ORDER: Phase[] = [
  "idle",
  "tap",
  "scan",
  "match",
  "process",
  "approved",
  "reward",
];

export function OneCardDemoFilm() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scrollIndex, setScrollIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);

  const scanning = phase === "scan";
  const locked = phase === "match" || phase === "process" || phase === "approved" || phase === "reward";
  const caption = CAPTIONS[phase];
  const progress = PHASE_ORDER.indexOf(phase) / (PHASE_ORDER.length - 1);

  const advance = useCallback(() => {
    if (paused) return;
    setPhase((p) => {
      const i = PHASE_ORDER.indexOf(p);
      const next = PHASE_ORDER[(i + 1) % PHASE_ORDER.length]!;
      if (next === "idle") setCycle((c) => c + 1);
      if (next === "scan") setScrollIndex(0);
      return next;
    });
  }, [paused]);

  useEffect(() => {
    const t = setTimeout(advance, PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, advance, paused, cycle]);

  useEffect(() => {
    if (!scanning || paused) return;
    const t = setInterval(() => {
      setScrollIndex((i) => (i >= WINNER_INDEX ? WINNER_INDEX : i + 1));
    }, 520);
    return () => clearInterval(t);
  }, [scanning, paused, cycle]);

  useEffect(() => {
    if (locked) setScrollIndex(WINNER_INDEX);
  }, [locked, phase]);

  return (
    <div
      className="relative flex min-h-[32rem] w-full flex-col overflow-hidden rounded-2xl sm:min-h-[34rem] sm:rounded-3xl"
      style={{
        background:
          "linear-gradient(145deg, #e8dfd0 0%, #d4c4a8 35%, #c9b896 70%, #b8a078 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.1)_100%)]"
        aria-hidden
      />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between px-4 py-3 sm:px-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-sm">
          <Image src="/brand-mark.png" alt="" width={48} height={32} className="h-5 w-auto" />
          <span className="text-xs font-bold text-brand-ink">OneCard</span>
        </span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand-ink shadow-sm transition hover:bg-white"
        >
          {paused ? "Play" : "Pause"}
        </button>
      </header>

      {/* Caption — own row, solid panel */}
      <div className="relative z-10 shrink-0 px-4 sm:px-5">
        <div className="flex min-h-[4.25rem] items-center justify-center rounded-xl bg-white/95 px-4 py-3 shadow-sm ring-1 ring-black/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={FADE}
              className="w-full text-center"
            >
              <p className="text-sm font-extrabold uppercase tracking-wide text-brand-ink sm:text-[0.95rem]">
                {caption.title}
              </p>
              <p className="mt-1.5 text-xs leading-snug text-brand-muted sm:text-sm">
                {caption.sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Main scene — stacked sections with clear gaps */}
      <div className="relative z-0 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-5 sm:gap-7 sm:px-6">
        {/* Linked cards */}
        <div className="w-full max-w-[18rem]">
          <p className="mb-2.5 text-center text-[0.6rem] font-bold uppercase tracking-widest text-brand-ink/55">
            Your linked cards
          </p>
          <div className="relative h-[52px] w-full overflow-hidden rounded-xl bg-black/10 shadow-inner ring-1 ring-black/5">
            <AnimatePresence mode="wait">
              {locked ? (
                <motion.div
                  key="winner"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                  className="absolute inset-0 flex items-center justify-between rounded-xl px-4 text-white"
                  style={cardBg(WINNER.from, WINNER.to)}
                >
                  <span className="text-[0.55rem] font-bold uppercase">{WINNER.issuer}</span>
                  <span className="text-sm font-bold">{WINNER.short}</span>
                  {(phase === "approved" || phase === "reward") && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-mint">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="scroll"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                  className="absolute inset-0"
                >
                  <motion.div
                    animate={{ y: -scrollIndex * CARD_H }}
                    transition={{ duration: 0.65, ease: EASE }}
                  >
                    {STRIP.map((card) => (
                      <div
                        key={card.id}
                        className={`flex h-[52px] items-center justify-between rounded-xl px-4 text-white ${
                          card.id !== STRIP[scrollIndex]?.id ? "brightness-90" : ""
                        }`}
                        style={cardBg(card.from, card.to)}
                      >
                        <span className="text-[0.55rem] font-bold uppercase">{card.issuer}</span>
                        <span className="text-sm font-bold">{card.short}</span>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Terminal + OneCard */}
        <div className="flex flex-col items-center">
          <div className="w-[13rem] rounded-2xl bg-slate-900 p-3.5 shadow-2xl sm:w-[14rem]">
            <div className="rounded-xl bg-slate-800 px-4 py-4 text-center text-white">
              <p className="text-xs text-slate-400">Uber Eats</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">$84.50</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="mt-2.5 min-h-[1.25rem] text-xs text-slate-300"
                >
                  {STATUS[phase]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="relative z-10 -mt-8">
            <OneCardLogo variant="card" cardholderName="Alex Chen" />
          </div>
        </div>

        {/* Step pills */}
        <div className="flex gap-2.5 pt-1">
          {(["Tap", "Route", "Earn"] as const).map((label, i) => {
            const active =
              (i === 0 && (phase === "tap" || phase === "scan")) ||
              (i === 1 && (phase === "match" || phase === "process")) ||
              (i === 2 && (phase === "approved" || phase === "reward"));
            return (
              <motion.span
                key={label}
                animate={{
                  backgroundColor: active ? "#163300" : "rgba(255,255,255,0.85)",
                  color: active ? "#ffffff" : "#5c6c66",
                  scale: active ? 1.04 : 1,
                }}
                transition={{ duration: 0.45, ease: EASE }}
                className="rounded-full px-4 py-1.5 text-[0.65rem] font-bold shadow-sm"
              >
                {label}
              </motion.span>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <footer className="relative z-10 shrink-0 px-4 pb-4 pt-2 sm:px-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/50">
          <motion.div
            className="h-full rounded-full bg-brand-ink"
            animate={{ width: `${Math.max(progress * 100, 4)}%` }}
            transition={{ duration: 0.65, ease: EASE }}
          />
        </div>
      </footer>
    </div>
  );
}
