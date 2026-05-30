"use client";

import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { DEMO_ROUTING_CARDS, DEMO_ROUTING_WINNER_INDEX } from "@/components/how-it-works/demoData";
import { GuidedDemo, type GuidedStep, MockupScreenTransition } from "@/components/how-it-works/GuidedDemo";
import { RouteSceneLayout } from "@/components/how-it-works/RoutingPanel";
import { DEMO_EASE, DEMO_MS, DEMO_PANEL_CLASS } from "@/components/how-it-works/demoMotion";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";

const SCORE_ROWS = [
  { name: "Amex Cobalt", value: 8.47, pct: 100 },
  { name: "PC Financial", value: 3.55, pct: 42 },
  { name: "Scotiabank Scene+", value: 2.36, pct: 28 },
  { name: "TD Cash Back", value: 1.18, pct: 14 },
] as const;

const GUIDED_STEPS: GuidedStep[] = [
  { at: 0.08, point: { x: 72, y: 38 } },
  { at: 0.28, point: { x: 58, y: 52 } },
  { at: 0.52, point: { x: 52, y: 58 }, click: true },
  { at: 0.72, point: { x: 48, y: 48 } },
  { at: 0.9, point: { x: 78, y: 62 }, click: true },
];

function ScoringPanel({ progress }: { progress: number }) {
  const show = progress > 0.55;
  const settle = progress > 0.82;

  return (
    <div className={`flex h-full flex-col p-3 sm:p-4 ${DEMO_PANEL_CLASS}`}>
      <p className="text-[0.55rem] font-semibold uppercase tracking-wider text-brand-muted">
        How we score
      </p>
      <p className="mt-1 text-xs leading-relaxed text-brand-body">
        Earn rate × category match × bonus caps — highest expected value wins.
      </p>

      <ul className="mt-3 flex-1 space-y-2">
        {SCORE_ROWS.map((row, i) => {
          const gate = 0.58 + i * 0.06;
          const visible = progress >= gate;
          const barW = visible ? row.pct : 0;
          return (
            <li key={row.name}>
              <div className="flex justify-between text-[0.58rem]">
                <span className="font-medium text-brand-ink">{row.name}</span>
                <span className="tabular-nums text-brand-muted">${row.value.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <motion.div
                  className={`h-full rounded-full ${i === 0 ? "bg-emerald-500" : "bg-sky-400/70"}`}
                  initial={false}
                  animate={{ scaleX: barW / 100 }}
                  style={{ width: "100%", transformOrigin: "left center" }}
                  transition={{ duration: 0.35, ease: DEMO_EASE, delay: i * 0.04 }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <MockupScreenTransition screenKey={settle ? "settle" : "score"}>
        {settle ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DEMO_MS.entrance / 1000, ease: DEMO_EASE }}
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2.5"
          >
            <p className="flex items-center gap-1 text-[0.62rem] font-semibold text-emerald-800">
              <Check className="h-3 w-3" strokeWidth={2.5} />
              Settlement complete
            </p>
            <p className="mt-1 text-[0.55rem] leading-relaxed text-emerald-900/90">
              Charged to {DEMO_ROUTING_CARDS[DEMO_ROUTING_WINNER_INDEX]!.name}. Rewards post to your
              existing Amex account.
            </p>
          </motion.div>
        ) : (
          <p className="mt-3 text-[0.55rem] text-brand-muted">Analyzing {DEMO_ROUTING_CARDS.length} linked cards…</p>
        )}
      </MockupScreenTransition>
    </div>
  );
}

/** Modal deep dive: full wallet + scoring + settlement with guided cursor */
export const RoutingDeepDive = memo(function RoutingDeepDive() {
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(reducedMotion ? 0.9 : 0.2);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    let start: number | null = null;
    const duration = 9000;

    function tick(now: number) {
      if (start == null) start = now;
      const t = ((now - start) % duration) / duration;
      setProgress(0.15 + t * 0.8);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const zoom = progress > 0.5 && progress < 0.78 ? 1.06 : 1;
  const screenKey = progress < 0.4 ? "route" : progress < 0.8 ? "winner" : "settle";

  return (
    <GuidedDemo
      enabled
      steps={GUIDED_STEPS}
      progress={progress}
      zoom={zoom}
      zoomOrigin="42% 48%"
      className="h-full min-h-[14rem] w-full"
    >
      <div className="grid h-full min-h-[14rem] grid-cols-1 gap-3 p-2 sm:grid-cols-[1.15fr_0.85fr] sm:gap-4 sm:p-3">
        <MockupScreenTransition screenKey={screenKey} className="min-h-[12rem]">
          <RouteSceneLayout progress={progress} compact={false} showAllRows />
        </MockupScreenTransition>
        <ScoringPanel progress={progress} />
      </div>
    </GuidedDemo>
  );
});
