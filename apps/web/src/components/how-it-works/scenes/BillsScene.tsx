"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { DEMO_BILLS } from "@/components/how-it-works/demoData";
import { FloatingPanel } from "@/components/how-it-works/MockupFrame";
import type { MockupFrameDensity } from "@/components/how-it-works/MockupFrame";
import { OutroScene } from "@/components/how-it-works/scenes/IntroScene";
import { SCENE_EASE } from "@/components/how-it-works/SceneTransition";

export const BillsScene = memo(function BillsScene({
  progress,
  density = "player",
  reducedMotion = false,
  showOutro = false,
  animReady = true,
}: {
  progress: number;
  reducedMotion?: boolean;
  density?: MockupFrameDensity;
  showOutro?: boolean;
  animReady?: boolean;
}) {
  if (showOutro && density === "player") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <OutroScene reducedMotion={reducedMotion} />
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: animReady ? 1 : 0, y: animReady ? 0 : 8 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: reducedMotion ? 0 : animReady ? 0.1 : 0,
            ease: SCENE_EASE,
          }}
          className="relative z-20 flex flex-wrap items-center justify-center gap-3 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href="/get-started"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/simulator"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-zinc-300 underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Try the simulator
          </Link>
        </motion.div>
      </div>
    );
  }

  const sceneProgress = density === "player" && !animReady ? 0 : progress;
  const paid = sceneProgress > 0.65;

  return (
    <FloatingPanel title="Bill pay · OneCard">
      <p className="text-[0.55rem] leading-relaxed text-brand-muted">
        Scheduled bills routed to the optimal card
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {DEMO_BILLS.map((bill, i) => {
          const visible = density !== "player" || sceneProgress > 0.08 + i * 0.12;
          const isRouted = bill.routed;
          return (
            <motion.li
              key={bill.card}
              initial={false}
              animate={{ opacity: visible ? 1 : 0.35 }}
              transition={{ duration: reducedMotion ? 0 : 0.25, ease: SCENE_EASE }}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 ring-1 ${
                isRouted && paid
                  ? "bg-emerald-50 ring-emerald-200"
                  : isRouted
                    ? "bg-sky-50 ring-sky-200"
                    : "bg-white ring-zinc-100"
              }`}
            >
              <div className="min-w-0">
                <p className="text-[0.62rem] font-semibold text-brand-ink">{bill.card}</p>
                <p className="text-[0.5rem] text-brand-muted">Due {bill.due}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[0.62rem] font-bold tabular-nums text-brand-ink">{bill.amount}</p>
                {isRouted ? (
                  <p className="flex items-center justify-end gap-0.5 text-[0.48rem] font-semibold text-emerald-700">
                    <Check className="h-2.5 w-2.5" />
                    Routed
                  </p>
                ) : (
                  <p className="text-[0.48rem] text-brand-muted">Scheduled</p>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </FloatingPanel>
  );
});
