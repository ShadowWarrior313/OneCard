"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  DEMO_SPEND_BY_CARD,
  DEMO_SPEND_RECENT,
  DEMO_SPEND_CARD_LABEL,
  DEMO_SPEND_TOTAL,
} from "@/components/how-it-works/demoData";
import { FloatingPanel } from "@/components/how-it-works/MockupFrame";
import type { MockupFrameDensity } from "@/components/how-it-works/MockupFrame";
import { SCENE_EASE } from "@/components/how-it-works/SceneTransition";

const SPEND = DEMO_SPEND_BY_CARD.amex_cobalt;
const REWARDS_MONTHS = [
  { label: "Jan", pct: 42 },
  { label: "Feb", pct: 55 },
  { label: "Mar", pct: 48 },
  { label: "Apr", pct: 62 },
  { label: "May", pct: 78 },
  { label: "Jun", pct: 92 },
];

function useLoopProgress(
  density: MockupFrameDensity,
  progress: number,
  reducedMotion: boolean,
) {
  const [loop, setLoop] = useState(progress);

  useEffect(() => {
    if (density === "player") {
      setLoop(progress);
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const duration = reducedMotion ? 0 : 6000;

    function tick(now: number) {
      if (start == null) start = now;
      const t = duration <= 0 ? 0.75 : ((now - start) % duration) / duration;
      setLoop(Math.max(0.38, t));
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [density, progress, reducedMotion]);

  return density === "player" ? progress : loop;
}

export function SpendScene({
  progress,
  density = "player",
  reducedMotion = false,
  animReady = true,
}: {
  progress: number;
  density?: MockupFrameDensity;
  reducedMotion?: boolean;
  animReady?: boolean;
}) {
  const raw = useLoopProgress(density, progress, reducedMotion);
  const p = density === "player" && !animReady ? 0 : raw;
  const recent = DEMO_SPEND_RECENT[0]!;
  const pointsTarget = parseInt(recent.reward.replace(/[^\d]/g, ""), 10);
  const pointsShown = Math.round(pointsTarget * Math.min(1, Math.max(0, (p - 0.55) / 0.25)));
  const chartP = Math.min(1, Math.max(0, (p - 0.2) / 0.4));

  return (
    <FloatingPanel title="My Spend · OneCard">
      <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-[0.5rem] font-semibold uppercase tracking-wider text-brand-muted">
            This month
          </p>
          <p className="mt-0.5 text-sm font-bold text-brand-ink">
            {DEMO_SPEND_CARD_LABEL} · ${DEMO_SPEND_TOTAL}
          </p>

          <ul className="mt-2.5 space-y-1.5">
            {SPEND.categories.map((row, i) => {
              const rowP = Math.max(0, Math.min(1, (p - 0.12 - i * 0.07) / 0.32));
              return (
                <li key={row.label}>
                  <div className="flex justify-between text-[0.58rem]">
                    <span className="font-medium text-brand-ink">{row.label}</span>
                    <span className="tabular-nums text-brand-muted">${row.amount}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <motion.div
                      className={`h-full rounded-full ${row.label === "Groceries" ? "bg-emerald-600" : "bg-sky-500"}`}
                      initial={false}
                      animate={{ scaleX: rowP }}
                      style={{ width: "100%", transformOrigin: "left center" }}
                      transition={{ duration: reducedMotion ? 0 : 0.35, ease: SCENE_EASE }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl bg-zinc-50 p-2 ring-1 ring-zinc-100">
          <p className="text-[0.45rem] font-semibold uppercase tracking-wider text-brand-muted">
            Rewards · 6 mo
          </p>
          <div className="mt-2 flex h-14 items-end justify-between gap-1">
            {REWARDS_MONTHS.map((m, i) => {
              const barP = Math.max(0, Math.min(1, chartP - i * 0.08));
              return (
                <div key={m.label} className="flex h-full flex-1 flex-col items-center justify-end gap-0.5">
                  <div className="flex h-[85%] w-full items-end">
                    <motion.div
                      className="w-full rounded-sm bg-emerald-500/80"
                      initial={false}
                      animate={{ scaleY: barP }}
                      style={{ height: `${m.pct}%`, transformOrigin: "bottom center" }}
                      transition={{ duration: reducedMotion ? 0 : 0.3, ease: SCENE_EASE }}
                    />
                  </div>
                  <span className="text-[0.4rem] text-brand-muted">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-zinc-50 px-2.5 py-2 ring-1 ring-zinc-100">
        <p className="text-[0.45rem] font-semibold uppercase tracking-wider text-brand-muted">
          Recent payments
        </p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-semibold text-brand-ink">{recent.merchant}</p>
            <p className="text-[0.5rem] text-brand-muted">
              {recent.date} · {recent.category}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.62rem] font-bold tabular-nums text-brand-ink">
              ${recent.amount.toFixed(2)}
            </p>
            <p className="text-[0.5rem] font-medium text-emerald-600">
              +{pointsShown.toLocaleString()} pts
            </p>
          </div>
        </div>
      </div>
    </FloatingPanel>
  );
}
