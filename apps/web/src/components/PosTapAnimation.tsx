"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { OneCardLogo } from "./OneCardLogo";
import { useCallback, useEffect, useState } from "react";

type Phase =
  | "idle"
  | "tap"
  | "scan"
  | "match"
  | "process"
  | "approved"
  | "reward";

interface WalletCardVisual {
  id: string;
  short: string;
  issuer: string;
  gradient: string;
  text: string;
}

const SCAN_CARDS: WalletCardVisual[] = [
  {
    id: "scotia_momentum",
    short: "Momentum",
    issuer: "Scotiabank",
    gradient: "from-red-600 to-red-800",
    text: "text-white",
  },
  {
    id: "rbc_avion",
    short: "Avion",
    issuer: "RBC",
    gradient: "from-blue-700 to-blue-900",
    text: "text-white",
  },
  {
    id: "cibc_dividend",
    short: "Dividend",
    issuer: "CIBC",
    gradient: "from-red-700 to-[#8B0000]",
    text: "text-white",
  },
  {
    id: "td_cashback",
    short: "TD",
    issuer: "TD",
    gradient: "from-green-700 to-green-900",
    text: "text-white",
  },
  {
    id: "bmo_eclipse",
    short: "eclipse",
    issuer: "BMO",
    gradient: "from-slate-800 to-slate-950",
    text: "text-white",
  },
];

const WINNER: WalletCardVisual = {
  id: "amex_cobalt",
  short: "Cobalt",
  issuer: "Amex",
  gradient: "from-[#006fcf] to-[#004080]",
  text: "text-white",
};

const CAROUSEL_STRIP = [...SCAN_CARDS, WINNER];

/** Sync with CSS --oc-carousel-row */
const CARD_ROW_PX = 58;
const SCAN_MS = 520;
const SCROLL_TRANSITION = { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const };
const WINNER_INDEX = CAROUSEL_STRIP.length - 1;

const PHASE_DURATIONS: Record<Phase, number> = {
  idle: 1400,
  tap: 800,
  scan: SCAN_MS * CAROUSEL_STRIP.length + 600,
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

function WalletCardFace({
  card,
  winner,
  dimmed,
}: {
  card: WalletCardVisual;
  winner?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`oc-wallet-card bg-gradient-to-br ${card.gradient} ${card.text} ${
        winner ? "oc-wallet-card--winner" : ""
      } ${dimmed ? "oc-wallet-card--dimmed" : ""}`}
    >
      <span className="oc-wallet-card-issuer">{card.issuer}</span>
      <span className="oc-wallet-card-name">{card.short}</span>
      {winner && (
        <span className="oc-wallet-card-badge">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </div>
  );
}

export function PosTapAnimation() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scrollIndex, setScrollIndex] = useState(0);
  const [cycle, setCycle] = useState(0);

  const scanning = phase === "scan";
  const lockedOnWinner =
    phase === "match" ||
    phase === "process" ||
    phase === "approved" ||
    phase === "reward";
  const showCarousel = scanning || lockedOnWinner;
  const tapEngaged = phase !== "idle";
  const showApproved = phase === "approved" || phase === "reward";
  const showProcessing = phase === "process";

  const displayIndex = lockedOnWinner ? WINNER_INDEX : scrollIndex;

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
      if (i === order.length - 1) {
        setCycle((c) => c + 1);
        setScrollIndex(0);
        return "idle";
      }
      return order[i + 1]!;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(advance, PHASE_DURATIONS[phase]);
    return () => clearTimeout(t);
  }, [phase, advance, cycle]);

  useEffect(() => {
    if (phase !== "scan") return;
    setScrollIndex(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      if (i < CAROUSEL_STRIP.length) setScrollIndex(i);
      else clearInterval(t);
    }, SCAN_MS);
    return () => clearInterval(t);
  }, [phase, cycle]);

  useEffect(() => {
    if (lockedOnWinner) setScrollIndex(WINNER_INDEX);
  }, [lockedOnWinner]);

  return (
    <div className="oc-pos-scene" aria-label="OneCard payment animation">
      {/* Wallet scroll */}
      <div className="oc-pos-carousel">
        <p className="oc-pos-carousel-label">
          {scanning
            ? "Scanning wallet…"
            : lockedOnWinner
              ? "Optimal card selected"
              : "Your linked cards"}
        </p>

        <div
          className={`oc-pos-carousel-viewport ${lockedOnWinner ? "oc-pos-carousel-viewport--locked" : ""}`}
        >
          {showCarousel ? (
            <motion.div
              className="oc-pos-carousel-scroll"
              initial={false}
              animate={{ y: -displayIndex * CARD_ROW_PX }}
              transition={SCROLL_TRANSITION}
            >
              {CAROUSEL_STRIP.map((card, i) => (
                <WalletCardFace
                  key={card.id}
                  card={card}
                  winner={card.id === WINNER.id && lockedOnWinner}
                  dimmed={scanning && i !== displayIndex}
                />
              ))}
            </motion.div>
          ) : (
            <div className="oc-pos-carousel-track--idle">
              <WalletCardFace card={SCAN_CARDS[0]!} dimmed />
            </div>
          )}

          {scanning && (
            <>
              <div className="oc-pos-carousel-fade oc-pos-carousel-fade--top" aria-hidden />
              <div className="oc-pos-carousel-fade oc-pos-carousel-fade--bottom" aria-hidden />
            </>
          )}
        </div>
      </div>

      {/* 3D POS + floating card */}
      <div className="oc-pos-stage">
        <motion.div
          className="oc-pos-terminal-3d"
          initial={false}
          animate={{
            rotateX: tapEngaged ? 10 : 14,
            rotateY: tapEngaged ? -2 : 0,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <div className="oc-pos-terminal-shell">
            <div className="oc-pos-terminal-bezel">
              <div className="oc-pos-screen">
                <div className="oc-pos-screen-inner">
                  <p className="oc-pos-merchant">Uber Eats</p>
                  <p className="oc-pos-amount">$84.50</p>

                  <div className="oc-pos-screen-footer">
                    {showApproved ? (
                      <motion.div
                        className="oc-pos-approved"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <div className="oc-pos-check">
                          <Check className="h-6 w-6" strokeWidth={2.5} />
                        </div>
                        <p className="oc-pos-approved-text">Approved</p>
                      </motion.div>
                    ) : showProcessing ? (
                      <div className="oc-pos-processing">
                        <span className="oc-pos-dots">
                          <span />
                          <span />
                          <span />
                        </span>
                        <p className="oc-pos-status">{STATUS.process}</p>
                      </div>
                    ) : (
                      <p className="oc-pos-status">{STATUS[phase]}</p>
                    )}
                  </div>

                  {phase === "reward" && (
                    <p className="oc-pos-reward">Routed to Cobalt · +$6.76</p>
                  )}
                </div>
              </div>

              <div className="oc-pos-keypad">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="oc-pos-key" />
                ))}
              </div>

              <div className="oc-pos-contactless" aria-hidden>
                <motion.svg
                  viewBox="0 0 24 24"
                  className="oc-pos-nfc-icon"
                  animate={{ opacity: tapEngaged ? [0.35, 1, 0.35] : 0.5 }}
                  transition={{ duration: 1.4, repeat: tapEngaged ? Infinity : 0 }}
                >
                  <path
                    fill="currentColor"
                    d="M12 2C7.03 2 3 6.03 3 11c0 .55.45 1 1 1s1-.45 1-1c0-3.86 3.14-7 7-7s7 3.14 7 7c0 .55.45 1 1 1s1-.45 1-1c0-4.97-4.03-9-9-9zm0 5c-2.76 0-5 2.24-5 5 0 .55.45 1 1 1s1-.45 1-1c0-1.65 1.35-3 3-3s3 1.35 3 3c0 .55.45 1 1 1s1-.45 1-1c0-2.76-2.24-5-5-5zm0 5c-1.1 0-2 .9-2 2 0 .55.45 1 1 1s1-.45 1-1c0-.55.45-1 1-1s1 .45 1 1c0 .55.45 1 1 1s1-.45 1-1c0-1.1-.9-2-2-2z"
                  />
                </motion.svg>
              </div>
            </div>
            <div className="oc-pos-terminal-chin" aria-hidden />
          </div>
        </motion.div>

        <motion.div
          className="oc-onecard-physical"
          animate={{
            y: tapEngaged ? 28 : 0,
            z: tapEngaged ? 40 : 80,
            rotateX: tapEngaged ? -18 : -28,
            rotateZ: tapEngaged ? 2 : -4,
          }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
        >
          <OneCardLogo variant="card" cardholderName="John Doe" />
          {phase === "tap" && (
            <motion.div
              className="oc-tap-ripple"
              initial={{ scale: 0.5, opacity: 0.7 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.7 }}
            />
          )}
        </motion.div>

        <div className="oc-pos-shadow" aria-hidden />
      </div>

      <div className="oc-pos-phases">
        {(
          [
            ["Tap", ["idle", "tap"] as Phase[]],
            ["Match", ["scan", "match"] as Phase[]],
            ["Pay", ["process", "approved", "reward"] as Phase[]],
          ] as [string, Phase[]][]
        ).map(([label, phases]) => {
          const active = phases.includes(phase);
          const done =
            (label === "Tap" && !["idle", "tap"].includes(phase)) ||
            (label === "Match" &&
              ["process", "approved", "reward"].includes(phase)) ||
            (label === "Pay" && phase === "reward");
          return (
            <span
              key={label}
              className={`oc-pos-phase-pill ${active ? "oc-pos-phase-pill--active" : ""} ${done ? "oc-pos-phase-pill--done" : ""}`}
            >
              {done && !active ? <Check className="h-3 w-3" /> : null}
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
