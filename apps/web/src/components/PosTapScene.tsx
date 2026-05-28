"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wifi } from "lucide-react";
import { useState } from "react";
const EASE = [0.22, 1, 0.36, 1] as const;

export type TapStage = "idle" | "approach" | "contact" | "reading" | "done";

export const TAP_STAGE_ORDER: TapStage[] = [
  "idle",
  "approach",
  "contact",
  "reading",
  "done",
];

/** Fractional position within tap phase (0–1) → tap stage */
export function tapStageAtProgress(p: number): TapStage {
  const t = Math.max(0, Math.min(1, p));
  if (t < 0.12) return "idle";
  if (t < 0.38) return "approach";
  if (t < 0.52) return "contact";
  if (t < 0.82) return "reading";
  return "done";
}

function ContactlessIcon({ pulsing }: { pulsing: boolean }) {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      {pulsing && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border border-sky-400/45"
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-sky-400/30"
            animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
          />
        </>
      )}
      <svg viewBox="0 0 32 32" className="relative h-8 w-8 text-sky-500" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M8 16c0-4.4 3.6-8 8-8M4 16c0-6.6 5.4-12 12-12M12 16c0-2.2 1.8-4 4-4"
        />
      </svg>
    </div>
  );
}

function PaymentCard({
  name,
  stage,
  visible,
  flipped,
}: {
  name: string;
  stage: TapStage;
  visible: boolean;
  flipped: boolean;
}) {
  const tapped = stage === "contact" || stage === "reading" || stage === "done";

  return (
    <motion.div
      className="absolute left-1/2 z-20 w-[10.25rem] sm:w-[11.5rem]"
      style={{
        x: "-50%",
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      }}
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        top: tapped ? "1.25rem" : "-1.75rem",
        y: visible ? 0 : -10,
        rotateX: tapped ? 6 : -8,
        rotateZ: tapped ? 0 : -2,
        scale: tapped ? 0.94 : visible ? 0.98 : 0.94,
      }}
      whileHover={{
        y: visible ? (tapped ? -2 : -6) : 0,
        scale: tapped ? 0.95 : 1,
      }}
      transition={{
        opacity: { duration: 0.7, ease: EASE },
        y: { duration: 0.75, ease: EASE },
        top: { duration: 0.85, ease: EASE },
        rotateX: { duration: 0.85, ease: EASE },
        rotateZ: { duration: 0.85, ease: EASE },
        scale: { duration: 0.75, ease: EASE },
      }}
    >
      <motion.div
        animate={{
          boxShadow: tapped
            ? "0 6px 20px rgba(14,116,144,0.22)"
            : "0 16px 32px rgba(14,116,144,0.16)",
        }}
        className="relative aspect-[1.586/1] h-auto w-full rounded-[0.9rem] ring-1 ring-white/15 sm:rounded-[0.95rem]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-[0.9rem] bg-gradient-to-br from-[#1a1a1c] via-zinc-950 to-black p-3.5 text-white sm:rounded-[0.95rem] sm:p-4"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="absolute inset-0 flex flex-col"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <div className="flex items-start justify-between p-3.5 sm:p-4">
              <div className="h-[1.15rem] w-[1.65rem] rounded-sm bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner sm:h-5 sm:w-7" />
              <span className="text-[0.45rem] font-bold uppercase tracking-[0.2em] text-white/35">
                OneCard
              </span>
            </div>
            <div className="mt-auto p-3.5 pt-0 sm:p-4 sm:pt-0">
              <p className="text-[0.45rem] font-medium uppercase tracking-wider text-white/40">
                Universal wallet
              </p>
              <p className="mt-0.5 truncate text-[0.72rem] font-semibold sm:text-[0.78rem]">{name}</p>
              <div className="mt-2.5 flex justify-end gap-0.5 sm:mt-3">
                <span className="h-3 w-3 rounded-full bg-red-500/90" />
                <span className="-ml-1.5 h-3 w-3 rounded-full bg-amber-400/90" />
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 rounded-[0.9rem] bg-gradient-to-br from-[#111318] via-zinc-900 to-black sm:rounded-[0.95rem]"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="mt-3.5 h-5 w-full bg-zinc-900/95 sm:mt-4 sm:h-6" />
            <div className="px-3.5 pt-3 sm:px-4 sm:pt-3.5">
              <div className="h-6 rounded-sm bg-zinc-100/90 px-2 py-1 text-right font-mono text-[0.6rem] font-semibold tracking-widest text-zinc-800 sm:h-6.5 sm:text-[0.62rem]">
                827
              </div>
              <div className="mt-2 h-6 rounded-sm bg-zinc-800/80 px-2 py-1 text-[0.5rem] leading-tight text-zinc-400 sm:h-7 sm:text-[0.55rem]">
                Authorized signature
              </div>
              <p className="mt-2 text-[0.48rem] leading-relaxed text-zinc-400 sm:text-[0.5rem]">
                This card is property of OneCard. If found, please return to issuer.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

    </motion.div>
  );
}

function TerminalScreen({ stage, visible }: { stage: TapStage; visible: boolean }) {
  const status =
    stage === "idle" || stage === "approach"
      ? "Present card"
      : stage === "contact"
        ? "Hold near reader…"
        : stage === "reading"
          ? "Reading card…"
          : "Card detected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
      transition={{ duration: 0.6, ease: EASE, delay: visible ? 0.15 : 0 }}
      className="relative overflow-hidden rounded-lg bg-[#0f172a] px-3.5 py-3.5 text-white ring-1 ring-slate-700/50"
    >
      <div className="relative flex items-center justify-between text-[0.5rem] text-white/35">
        <span className="font-medium tabular-nums">9:41</span>
        <div className="flex items-center gap-1">
          <Wifi className="h-2.5 w-2.5" />
          <span>100%</span>
        </div>
      </div>
      <p className="relative mt-3 text-[0.6rem] font-semibold text-sky-300">Uber Eats</p>
      <p className="relative mt-0.5 text-[1.65rem] font-bold tabular-nums leading-none">
        $84.50
      </p>
      <AnimatePresence mode="wait">
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="relative mt-2.5 min-h-[1rem] text-[0.65rem] text-white/50"
        >
          {status}
        </motion.p>
      </AnimatePresence>
      {(stage === "reading" || stage === "done") && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0.5 }}
          animate={{ scaleX: 1, opacity: 1 }}
          className="relative mt-3 h-0.5 origin-left rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
        />
      )}
    </motion.div>
  );
}

export function PosTapScene({
  cardholderName,
  stage,
  contentVisible = true,
}: {
  cardholderName: string;
  stage: TapStage;
  contentVisible?: boolean;
}) {
  const pulsing = stage === "idle" || stage === "approach";
  const flash = stage === "contact" || stage === "reading";
  const [cardFlipped, setCardFlipped] = useState(false);

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[21rem] overflow-visible px-1 pb-2 pt-2">
      {/* Headroom so the card never clips at the top */}
      <div className="relative mx-auto overflow-visible pt-[5.5rem] sm:pt-[6.75rem]">
        <PaymentCard
          name={cardholderName}
          stage={stage}
          visible={contentVisible}
          flipped={cardFlipped}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: contentVisible ? 1 : 0, y: contentVisible ? 0 : 12 }}
          transition={{ duration: 0.65, ease: EASE, delay: contentVisible ? 0.2 : 0 }}
          className="relative mx-auto w-full max-w-[14rem]"
        >
          <div className="relative z-10 mx-auto -mb-0.5 flex h-[2.85rem] w-[92%] items-center justify-center rounded-t-[1rem] bg-gradient-to-b from-slate-500 to-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:h-[3.25rem] sm:w-[90%] sm:rounded-t-[1.1rem]">
            <ContactlessIcon pulsing={pulsing} />
            <AnimatePresence>
              {flash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.35, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 rounded-t-[1.1rem] bg-sky-300/50"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="relative rounded-b-[1.1rem] bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 p-2.5 pb-3 shadow-[0_16px_32px_rgba(14,116,144,0.15)] ring-1 ring-slate-600/40">
            <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-500/90" aria-hidden />
            <TerminalScreen stage={stage} visible={contentVisible} />
            <div className="mt-2.5 flex justify-center gap-1" aria-hidden>
              <span
                className={`h-1 w-1 rounded-full ${flash ? "bg-sky-400" : "bg-emerald-400/80"}`}
              />
              <span className="h-1 w-1 rounded-full bg-slate-500" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[10.75rem] z-30 flex justify-center sm:top-[12rem]">
        <button
          type="button"
          onClick={() => setCardFlipped((v) => !v)}
          className="pointer-events-auto rounded-full border border-sky-200 bg-white px-3 py-1.5 text-[0.62rem] font-semibold text-brand-ink shadow-sm transition hover:bg-sky-50"
        >
          {cardFlipped ? "Show front" : "Rotate card"}
        </button>
      </div>

      <motion.p
        animate={{ opacity: contentVisible ? 1 : 0 }}
        className="mt-3 text-center text-[0.6rem] font-medium tracking-wide text-sky-600/70 sm:mt-4 sm:text-[0.65rem]"
      >
        Contactless tap
      </motion.p>
    </div>
  );
}
