"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

function FaceIdMark({ scanning }: { scanning: boolean }) {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      {scanning && (
        <>
          <motion.span
            className="absolute inset-0 rounded-[1.4rem] border-2 border-white/30"
            animate={{ scale: [1, 1.32], opacity: [0.5, 0] }}
            transition={{ duration: 1.65, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-2 rounded-[1.25rem] border border-sky-400/50"
            animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
            transition={{ duration: 1.65, repeat: Infinity, ease: "easeOut", delay: 0.28 }}
          />
        </>
      )}

      <div className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-[1.15rem] bg-gradient-to-b from-zinc-600 to-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/15">
        <svg viewBox="0 0 56 56" className="h-11 w-11" aria-hidden>
          <rect
            x="8"
            y="8"
            width="40"
            height="40"
            rx="10"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            opacity="0.9"
          />
          <circle cx="22" cy="24" r="2.5" fill="white" />
          <circle cx="34" cy="24" r="2.5" fill="white" />
          <path
            d="M22 34c2 3 10 3 12 0"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M18 18c0-2 2-4 4-4M34 14c2 0 4 2 4 4"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>
    </div>
  );
}

export function FaceIdOverlay({
  done,
  merchantName,
  amount,
}: {
  done: boolean;
  merchantName: string;
  amount: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black px-5"
    >
      {done ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          className="flex flex-col items-center text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_48px_rgba(16,185,129,0.45)]">
            <Check className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <p className="mt-6 text-lg font-semibold text-white">Done</p>
          <p className="mt-2 text-sm text-white/55">
            {merchantName} · {amount}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <FaceIdMark scanning />
          <p className="mt-8 text-base font-medium text-white">Face ID</p>
          <p className="mt-2 max-w-[11rem] text-xs leading-relaxed text-white/45">
            Confirm payment to {merchantName}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
