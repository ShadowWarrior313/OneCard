"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Wifi } from "lucide-react";
import { DemoPhoneShell } from "@/components/demo/DemoPhoneShell";
import { DemoOneCard } from "@/components/demo/DemoOneCard";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Layout — cluster phone + reader in the white stage (separate from 3D tilt) */
const TAP_CLUSTER_Y = "56%";
const TAP_IDLE_Y = "56%";
const TAP_CLUSTER_SCALE = 0.88;
/** Gap between reader bottom and phone top (NFC dot sits in this space) */
const READER_ABOVE_PHONE = "mb-1";

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
  if (t < 0.72) return "reading";
  return "done";
}

function WalletHome({ stage }: { stage: TapStage }) {
  const nearReader = stage === "approach" || stage === "contact" || stage === "reading";
  const approved = stage === "done";

  return (
    <div className="flex flex-col items-center gap-2.5 py-2">
      <p className="text-center text-[0.625rem] font-semibold text-brand-muted">Wallet</p>
      <DemoOneCard />
      <AnimatePresence>
        {approved && (
          <motion.div
            key="approved"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/40"
            aria-hidden
          >
            <Check className="h-5 w-5 text-white" strokeWidth={2.75} />
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-center text-[0.5625rem] leading-relaxed text-brand-muted">
        {approved
          ? "Payment approved"
          : nearReader
            ? "Hold top of iPhone near reader"
            : "Ready to pay with OneCard"}
      </p>
    </div>
  );
}

function PosTerminal({
  stage,
  merchantName,
  amount,
}: {
  stage: TapStage;
  merchantName: string;
  amount: string;
}) {
  const active = stage === "approach" || stage === "contact" || stage === "reading";
  const status =
    stage === "idle"
      ? "Ready"
      : stage === "approach"
        ? "Hold iPhone near reader"
        : stage === "done"
          ? "Approved"
          : stage === "reading"
            ? "Reading card…"
            : "Hold near reader…";

  return (
    <div className="relative z-10 mx-auto w-full max-w-[9.5rem]">
      <div className="rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 p-2 shadow-lg ring-1 ring-slate-600/50">
        <div className="overflow-hidden rounded-lg bg-[#0f172a] px-2.5 py-2 text-white">
          <div className="flex items-center justify-between text-[0.45rem] text-white/45">
            <span className="tabular-nums">9:41</span>
            <Wifi className="h-2 w-2" />
          </div>
          <p className="mt-1.5 text-[0.5rem] font-semibold text-sky-300">{merchantName}</p>
          <p className="text-sm font-bold tabular-nums">{amount}</p>
          <p className="mt-1 min-h-[0.75rem] text-[0.5rem] text-white/50">{status}</p>
          {(stage === "reading" || stage === "done") && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="mt-1.5 h-0.5 origin-left rounded-full bg-emerald-400"
            />
          )}
        </div>
        <div className="mt-2 flex justify-center pb-0.5">
          <motion.span
            animate={
              active
                ? { opacity: [0.35, 1, 0.35], scale: [1, 1.1, 1] }
                : stage === "done"
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0.35, scale: 1 }
            }
            transition={{ duration: 1.1, repeat: active ? Infinity : 0 }}
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
              stage === "done"
                ? "border-emerald-400 bg-emerald-500/25"
                : "border-sky-400/60 bg-sky-500/10"
            }`}
          >
            {stage === "done" ? (
              <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-400" aria-hidden>
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M6 12c0-3.3 2.7-6 6-6M3 12c0-4.9 4.1-9 9-9M9 12c0-1.7 1.3-3 3-3"
                />
              </svg>
            )}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

/** Pivot at bottom (hand). Negative rotateX tips the top up toward the reader above. */
function phoneTransform(stage: TapStage): {
  rotateX: number;
  rotateZ: number;
  y: number;
  z: number;
  scale: number;
} {
  switch (stage) {
    case "idle":
      return { rotateX: 0, rotateZ: 0, y: 0, z: 0, scale: 1 };
    case "approach":
      return { rotateX: -16, rotateZ: 0, y: -8, z: 12, scale: 0.98 };
    case "contact":
      return { rotateX: -22, rotateZ: 0, y: -12, z: 18, scale: 0.97 };
    case "reading":
      return { rotateX: -24, rotateZ: 0, y: -14, z: 20, scale: 0.96 };
    case "done":
      return { rotateX: -20, rotateZ: 0, y: -10, z: 16, scale: 0.97 };
  }
}

export function PosTapScene({
  stage,
  contentVisible = true,
  merchantName = "Loblaws",
  amount = "$118.40",
}: {
  cardholderName: string;
  stage: TapStage;
  contentVisible?: boolean;
  merchantName?: string;
  amount?: string;
}) {
  const showTerminal = stage !== "idle";
  const approved = stage === "done";
  const { rotateX, rotateZ, y, z, scale } = phoneTransform(stage);
  const tapping = stage !== "idle";

  return (
    <motion.div
      animate={{ opacity: contentVisible ? 1 : 0 }}
      className="relative mx-auto w-full min-w-0 max-w-[14rem]"
    >
      {/* 3D stage — phone arcs from upright toward terminal */}
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          height: "21.5rem",
          perspective: "850px",
          perspectiveOrigin: "50% 48%",
        }}
      >
        <div
          className="absolute left-1/2 flex w-full flex-col items-center"
          style={{
            top: showTerminal ? TAP_CLUSTER_Y : TAP_IDLE_Y,
            transform: `translate(-50%, -50%) scale(${TAP_CLUSTER_SCALE})`,
            transformOrigin: "center center",
            transformStyle: "preserve-3d",
          }}
        >
          <AnimatePresence>
            {showTerminal && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
                className={`relative z-30 w-full shrink-0 ${READER_ABOVE_PHONE}`}
              >
                <PosTerminal stage={stage} merchantName={merchantName} amount={amount} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="relative z-20 w-full shrink-0"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "50% 100%",
            }}
            animate={{
              rotateX,
              rotateZ,
              y,
              z,
              scale,
            }}
            transition={{ duration: 0.85, ease: EASE }}
          >
            <div
              className="pointer-events-none absolute -bottom-3 left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-[100%] bg-black/15 blur-md"
              style={{
                opacity: tapping ? 0.5 : 0.25,
                transform: "translateZ(-20px)",
              }}
              aria-hidden
            />
            <div className="relative">
              <DemoPhoneShell className="!overflow-hidden !px-2">
                <div className="relative min-h-[17.5rem] flex-1">
                  <WalletHome stage={stage} />
                </div>
              </DemoPhoneShell>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.p
        animate={{ opacity: contentVisible ? 1 : 0 }}
        className="mt-2 text-center text-[0.5625rem] font-medium text-brand-muted"
      >
        {approved
          ? "Payment complete"
          : stage === "reading"
            ? "Reading card…"
            : stage === "idle"
              ? "Wallet · OneCard"
              : "Tap with top of iPhone"}
      </motion.p>
    </motion.div>
  );
}
