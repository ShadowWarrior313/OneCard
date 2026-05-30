"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { DEMO_EASE, DEMO_MS } from "@/components/how-it-works/demoMotion";

export const DemoReplayPrompt = memo(function DemoReplayPrompt({
  onReplay,
  reducedMotion = false,
}: {
  onReplay: () => void;
  reducedMotion?: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 px-4"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : DEMO_MS.entrance / 1000, ease: DEMO_EASE }}
      role="dialog"
      aria-label="Demo finished"
    >
      <div className="flex max-w-xs flex-col items-center text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReplay();
          }}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-ink shadow-lg transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Replay demo"
        >
          <RotateCcw className="h-6 w-6" strokeWidth={2.25} />
        </button>
        <p className="mt-4 text-base font-semibold text-white">Watch again?</p>
        <p className="mt-1 text-sm text-white/75">Tap the replay button to run through the demo from the start.</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReplay();
          }}
          className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-ink transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Replay demo
        </button>
      </div>
    </motion.div>
  );
});
