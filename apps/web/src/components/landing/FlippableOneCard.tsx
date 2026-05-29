"use client";

import { motion } from "framer-motion";
import { OneCardFace } from "@/components/OneCardFace";
import { useUserProfile } from "@/context/UserProfileContext";
import {
  ONECARD_DEMO_CVV,
  ONECARD_DEMO_EXPIRY,
  ONECARD_DEMO_NUMBER,
} from "@/lib/oneCardDisplay";

const EASE = [0.22, 1, 0.36, 1] as const;

function BackMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.48rem] font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <span className="font-mono text-[0.65rem] font-semibold tracking-wide text-zinc-100 sm:text-[0.7rem]">
        {value}
      </span>
    </div>
  );
}

export function FlippableOneCard({ flipped }: { flipped: boolean }) {
  const { cardholderName } = useUserProfile();

  return (
    <motion.div
      className="relative aspect-[1.586] w-full"
      style={{ transformStyle: "preserve-3d" }}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <OneCardFace className="h-full shadow-[0_24px_64px_rgba(14,116,144,0.28)]" />
      </div>

      <div
        className="absolute inset-0 flex flex-col overflow-hidden rounded-[1.15rem] shadow-[0_24px_64px_rgba(14,116,144,0.28)] ring-1 ring-white/15"
        style={{
          transform: "rotateY(180deg)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          background: "#0a0a0b",
        }}
      >
        <div className="h-8 w-full shrink-0 bg-black sm:h-9" aria-hidden />

        <div className="mt-1 h-4 w-full shrink-0 bg-zinc-100/90 sm:mt-1.5 sm:h-[1.125rem]" aria-hidden />

        <div className="flex min-h-0 flex-1 flex-col bg-[#0a0a0b] px-4 pb-2 pt-2 sm:px-5 sm:pt-2.5">
          <p className="truncate text-[0.5rem] font-semibold uppercase tracking-[0.18em] text-zinc-400 sm:text-[0.55rem]">
            {cardholderName}
          </p>
          <p className="mt-1.5 whitespace-nowrap font-mono text-[10px] font-semibold leading-none tracking-[0.04em] text-white tabular-nums sm:mt-2 sm:text-[11px]">
            {ONECARD_DEMO_NUMBER}
          </p>
          <div className="mt-1.5 flex shrink-0 items-end gap-5 sm:mt-2 sm:gap-6">
            <BackMeta label="Good thru" value={ONECARD_DEMO_EXPIRY} />
            <BackMeta label="CVV" value={ONECARD_DEMO_CVV} />
          </div>
          <p className="mt-auto pt-1.5 text-right text-[0.48rem] font-medium uppercase tracking-[0.2em] text-zinc-600">
            OneCard
          </p>
        </div>
      </div>
    </motion.div>
  );
}
