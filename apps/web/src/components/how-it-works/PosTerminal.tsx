"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { DEMO_AMOUNT, DEMO_MERCHANT } from "@/components/how-it-works/demoData";
import { SCENE_EASE } from "@/components/how-it-works/SceneTransition";

function ContactlessBadge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 24" className={className} aria-hidden>
      <rect x="1" y="1" width="46" height="22" rx="11" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        d="M10 14.5h5.5l1.2-2.2 1.8 4.4 1.2-2.2H26"
      />
      <path fill="none" stroke="currentColor" strokeWidth="1.2" d="M30 12a4 4 0 0 1 8 0" />
      <path fill="none" stroke="currentColor" strokeWidth="1.2" d="M32.5 12a1.5 1.5 0 0 1 3 0" />
      <circle cx="36.5" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

function LineRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 py-1.5 text-[0.42rem] leading-none ${
        bold ? "font-semibold text-[#1a2744]" : "text-[#5c6478]"
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

export const PosTerminal = memo(function PosTerminal({
  approved,
  reducedMotion = false,
}: {
  approved: boolean;
  reducedMotion?: boolean;
}) {
  return (
    <div
      className="relative w-[7.75rem] shrink-0 sm:w-[8.25rem]"
      style={{
        filter: "drop-shadow(0 10px 24px rgba(15, 23, 42, 0.14))",
      }}
    >
      <div className="shrink-0 rounded-[1.35rem] bg-white p-2 ring-1 ring-zinc-200/90">
        <div className="overflow-hidden rounded-[1rem] bg-[#111827] p-[0.3rem]">
          <div className="flex justify-center pb-1 pt-0.5">
            <span className="h-[0.28rem] w-[0.28rem] rounded-full bg-zinc-600" aria-hidden />
          </div>

          <div className="relative min-h-[11.35rem] overflow-hidden rounded-[0.72rem] bg-white px-2.5 pb-2 pt-2 text-[#1a2744]">
            {!approved ? (
              <motion.div
                key="idle"
                className="h-full"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, ease: SCENE_EASE }}
              >
                <div className="flex justify-center">
                  <ContactlessBadge className="h-4 w-9 text-[#334155]" />
                </div>

                <p className="mt-2 text-center text-[0.48rem] font-medium text-[#1a2744]">
                  Pay {DEMO_MERCHANT}
                </p>
                <p className="mt-1 text-center text-[1.05rem] font-bold leading-none tracking-tight tabular-nums sm:text-[1.15rem]">
                  {DEMO_AMOUNT}
                </p>
                <p className="mx-auto mt-1.5 max-w-[9rem] text-center text-[0.38rem] leading-snug text-[#7b8499]">
                  Tap, insert, or swipe your card to pay
                </p>

                <div className="mt-2.5 border-t border-[#e8ebf0]">
                  <LineRow label="Groceries" value="$112.11" />
                  <div className="border-t border-[#e8ebf0]">
                    <LineRow label="Tax" value="$6.29" />
                  </div>
                  <div className="border-t border-[#e8ebf0]">
                    <LineRow label="Total" value={DEMO_AMOUNT} bold />
                  </div>
                </div>

                <div className="mt-2.5 rounded-lg bg-[#eceff3] px-2 py-1.5 text-center text-[0.42rem] font-medium text-[#5c6478]">
                  Tap to pay
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="approved"
                className="flex h-full min-h-[11.35rem] flex-col"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, ease: SCENE_EASE }}
              >
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-2">
                  <motion.span
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500"
                    initial={false}
                    animate={
                      reducedMotion ? { opacity: 1 } : { opacity: [0.6, 1] }
                    }
                    transition={{ duration: 0.45, ease: SCENE_EASE }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </motion.span>
                  <p className="text-[0.58rem] font-bold text-emerald-600">Approved</p>
                  <p className="text-[1rem] font-bold leading-none tabular-nums">{DEMO_AMOUNT}</p>
                </div>

                <div className="border-t border-[#e8ebf0] pt-2">
                  <LineRow label="Total" value={DEMO_AMOUNT} bold />
                </div>
                <p className="mt-1.5 text-center text-[0.38rem] text-[#7b8499]">
                  {DEMO_MERCHANT} · Groceries
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-2 flex justify-center pb-0.5">
          <span className="h-[0.22rem] w-10 rounded-full bg-zinc-200" aria-hidden />
        </div>
      </div>
    </div>
  );
});
