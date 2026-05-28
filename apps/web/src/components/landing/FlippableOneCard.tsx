"use client";

import { motion } from "framer-motion";
import { OneCardFace } from "@/components/OneCardFace";

const EASE = [0.22, 1, 0.36, 1] as const;

export function FlippableOneCard({ flipped }: { flipped: boolean }) {
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
        className="absolute inset-0 overflow-hidden rounded-[1.15rem] shadow-[0_24px_64px_rgba(14,116,144,0.28)] ring-1 ring-white/15"
        style={{
          transform: "rotateY(180deg)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          background: "linear-gradient(145deg, #111318 0%, #0a0a0b 50%, #18181b 100%)",
        }}
      >
        <div className="mt-5 h-7 w-full bg-zinc-900/95 sm:mt-6 sm:h-8" />
        <div className="px-5 pt-4 sm:px-6 sm:pt-5">
          <div className="h-8 rounded-md bg-zinc-100/90 px-2 py-1.5 text-right font-mono text-xs font-semibold tracking-widest text-zinc-800">
            827
          </div>
          <div className="mt-2.5 h-8 rounded-md bg-zinc-800/80 px-2 py-1.5 text-[0.65rem] leading-tight text-zinc-400">
            Authorized signature
          </div>
          <p className="mt-3 text-[0.65rem] leading-relaxed text-zinc-500 sm:text-xs">
            This card is property of OneCard. If found, please return to issuer.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
