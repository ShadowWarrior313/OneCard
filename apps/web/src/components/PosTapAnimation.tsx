"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { OneCardLogo } from "./OneCardLogo";
import { IssuerLogo } from "./IssuerLogo";
import { useUserProfile } from "@/context/UserProfileContext";
import { useCallback, useEffect, useState, type CSSProperties } from "react";

type Phase = "idle" | "tap" | "scan" | "match" | "process" | "approved" | "reward";

function cardBg(from: string, to: string): CSSProperties {
  return {
    background: `linear-gradient(145deg, ${from} 0%, ${to} 62%, ${to} 100%)`,
  };
}

const SCAN_CARDS = [
  { id: "scotia_momentum", short: "Momentum", issuer: "Scotiabank", from: "#EC111A", to: "#b80d14" },
  { id: "rbc_ion", short: "ION", issuer: "RBC", from: "#3b82f6", to: "#0051A5" },
  { id: "cibc_dividend_infinite", short: "Dividend", issuer: "CIBC", from: "#8B1538", to: "#5c0d24" },
  { id: "td_cashback", short: "Cash Back", issuer: "TD", from: "#16a34a", to: "#14532d" },
];

const WINNER = {
  id: "amex_cobalt",
  short: "Cobalt",
  issuer: "American Express",
  from: "#38bdf8",
  to: "#312e81",
};

const STRIP = [...SCAN_CARDS, WINNER];
const CARD_H = 54;
const WINNER_INDEX = STRIP.length - 1;

const PHASE_MS: Record<Phase, number> = {
  idle: 1400,
  tap: 800,
  scan: 520 * STRIP.length + 600,
  match: 1100,
  process: 1300,
  approved: 2200,
  reward: 2400,
};

const STATUS: Record<Phase, string> = {
  idle: "Ready to tap",
  tap: "Reading chip…",
  scan: "Matching your wallet…",
  match: "Card recognized",
  process: "Authorizing…",
  approved: "Payment approved",
  reward: "5× MR · Dining",
};

export function PosTapAnimation() {
  const { cardholderName } = useUserProfile();
  const [phase, setPhase] = useState<Phase>("idle");
  const [scrollIndex, setScrollIndex] = useState(0);
  const [cycle, setCycle] = useState(0);

  const scanning = phase === "scan";
  const locked = phase !== "idle" && phase !== "tap" && phase !== "scan";

  const advance = useCallback(() => {
    setPhase((p) => {
      const order: Phase[] = [
        "idle",
        "tap",
        "scan",
        "match",
        "process",
        "approved",
        "reward",
      ];
      const i = order.indexOf(p);
      const next = order[(i + 1) % order.length];
      if (next === "idle") setCycle((c) => c + 1);
      if (next === "scan") setScrollIndex(0);
      return next;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(advance, PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, advance]);

  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(() => {
      setScrollIndex((i) => (i >= WINNER_INDEX ? WINNER_INDEX : i + 1));
    }, 520);
    return () => clearInterval(t);
  }, [scanning, cycle]);

  useEffect(() => {
    if (phase === "match" || phase === "process" || phase === "approved" || phase === "reward") {
      setScrollIndex(WINNER_INDEX);
    }
  }, [phase]);

  return (
    <div
      className="relative mx-auto flex w-[17.5rem] flex-col items-center"
      aria-label="OneCard payment animation"
    >
      <p className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
        Your linked cards
      </p>
      <div className="relative mb-3 h-[54px] w-full overflow-hidden rounded-lg">
        {locked ? (
          <div
            className="absolute inset-x-0 top-0 flex h-[54px] items-center gap-2 rounded-lg px-3 text-white"
            style={cardBg(WINNER.from, WINNER.to)}
          >
            <IssuerLogo issuer={WINNER.issuer} cardId={WINNER.id} size={28} />
            <span className="min-w-0 flex-1 truncate text-xs font-bold">{WINNER.short}</span>
            {(phase === "approved" || phase === "reward") && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-mint">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
            )}
          </div>
        ) : (
          <motion.div
            animate={{ y: -scrollIndex * CARD_H }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            {STRIP.map((card) => (
              <div
                key={card.id}
                className={`flex h-[54px] items-center gap-2 rounded-lg px-3 text-white ${
                  card.id !== STRIP[scrollIndex]?.id ? "brightness-90" : ""
                }`}
                style={cardBg(card.from, card.to)}
              >
                <IssuerLogo issuer={card.issuer} cardId={card.id} size={28} />
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{card.short}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <div className="relative flex flex-col items-center">
        <div
          className="relative w-[11.5rem] rounded-xl bg-slate-900 p-3 shadow-xl"
          style={{ transform: "rotateX(14deg)", transformStyle: "preserve-3d" }}
        >
          <div className="rounded-lg bg-slate-800 p-3 text-center text-white">
            <p className="text-[0.65rem] text-slate-400">Uber Eats</p>
            <p className="text-xl font-bold">$84.50</p>
            <p className="mt-2 text-[0.7rem] text-slate-300">{STATUS[phase]}</p>
          </div>
        </div>
        <div className="relative -mt-6 z-10">
          <OneCardLogo variant="card" cardholderName={cardholderName} />
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {(["Tap", "Match", "Pay"] as const).map((label, i) => {
          const active =
            (i === 0 && (phase === "tap" || phase === "scan")) ||
            (i === 1 && (phase === "match" || phase === "process")) ||
            (i === 2 && (phase === "approved" || phase === "reward"));
          return (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${
                active
                  ? "bg-brand-ink text-white"
                  : "bg-zinc-100 text-brand-muted"
              }`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
