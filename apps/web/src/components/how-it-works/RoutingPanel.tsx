"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import {
  DEMO_AMOUNT,
  DEMO_MERCHANT,
  DEMO_ROUTING_CARDS,
  DEMO_ROUTING_WINNER_INDEX,
} from "@/components/how-it-works/demoData";
import {
  routingFocusIndex,
  routingStatusMessage,
  routingWinnerBlend,
} from "@/components/how-it-works/demoDataCore";
import { FloatingPanel } from "@/components/how-it-works/MockupFrame";
import { DemoOneCardVisual } from "@/components/how-it-works/DemoOneCardVisual";
import { DEMO_EASE, DEMO_MS } from "@/components/how-it-works/demoMotion";
import { SCENE_EASE } from "@/components/how-it-works/SceneTransition";

const ROW_H = 36;
const COMPACT_INDICES = [0, 1, 2, 5] as const;

function listIndices(compact: boolean, showAllRows: boolean): number[] {
  if (showAllRows) return DEMO_ROUTING_CARDS.map((_, i) => i);
  if (compact) return [...COMPACT_INDICES];
  return DEMO_ROUTING_CARDS.map((_, i) => i);
}

export const RoutingPanel = memo(function RoutingPanel({
  progress,
  compact = false,
  showAllRows = false,
  enlargeReady = false,
  enlargePressed = false,
}: {
  progress: number;
  compact?: boolean;
  showAllRows?: boolean;
  enlargeReady?: boolean;
  enlargePressed?: boolean;
}) {
  const focusIdx = routingFocusIndex(progress);
  const winnerBlend = routingWinnerBlend(progress);
  const status = routingStatusMessage(progress);
  const winnerCard = DEMO_ROUTING_CARDS[DEMO_ROUTING_WINNER_INDEX]!;
  const onWinner = focusIdx === DEMO_ROUTING_WINNER_INDEX && winnerBlend > 0.75;
  const settled = winnerBlend >= 0.95;

  const indices = useMemo(
    () => listIndices(compact, showAllRows),
    [compact, showAllRows],
  );

  const listHeight = compact ? ROW_H * 3.2 : showAllRows ? ROW_H * 5.5 : ROW_H * 3.5;
  const focusInOrdered = indices.indexOf(focusIdx);
  const scrollY =
    focusInOrdered >= 0
      ? -focusInOrdered * ROW_H + listHeight / 2 - ROW_H / 2
      : 0;

  return (
    <div className="relative w-full">
      <FloatingPanel
        title="Routing · OneCard"
        enlargeReady={enlargeReady}
        enlargePressed={enlargePressed}
      >
        <div>
          <p className="text-[0.5rem] font-semibold uppercase tracking-wider text-brand-muted">
            Checkout
          </p>
          <div className="mt-1 flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
            <p className="min-w-0 truncate text-xs font-semibold text-brand-ink">{DEMO_MERCHANT}</p>
            <p className="shrink-0 text-sm font-bold tabular-nums text-brand-ink">{DEMO_AMOUNT}</p>
          </div>
        </div>

        <motion.div
          className={`mt-2 rounded-lg border px-2.5 py-2 ${
            winnerBlend > 0.5
              ? "border-emerald-200 bg-emerald-50"
              : "border-sky-200 bg-sky-50"
          }`}
          initial={false}
          animate={{ opacity: progress > 0.08 ? 1 : 0.6 }}
          transition={{ duration: 0.3, ease: DEMO_EASE }}
        >
          {status.kind === "comparing" && (
            <p className="text-[0.62rem] text-brand-muted">
              Detecting category…{" "}
              <span className="font-semibold text-brand-ink">Groceries</span>
            </p>
          )}
          {status.kind === "routing" && (
            <p className="text-[0.62rem] font-medium text-brand-ink">{status.text}</p>
          )}
          {status.kind === "complete" && (
            <p className="flex items-center gap-1 text-[0.62rem] font-medium text-emerald-700">
              <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />
              {status.text}
            </p>
          )}
        </motion.div>

        <p className="mt-2 text-[0.5rem] font-semibold uppercase tracking-wider text-brand-muted">
          Wallet analysis
        </p>

        <div className="relative mt-1 overflow-hidden" style={{ height: listHeight }}>
          <motion.ul
            initial={false}
            animate={{ y: scrollY }}
            transition={{ duration: 0.7, ease: SCENE_EASE }}
            className="space-y-1 will-change-transform"
          >
            {indices.map((cardIdx) => {
              const card = DEMO_ROUTING_CARDS[cardIdx]!;
              const focused = cardIdx === focusIdx;
              const isWinner = card.winner && onWinner;

              return (
                <motion.li
                  key={card.name}
                  layout
                  className={`flex h-[2rem] items-center justify-between gap-2 rounded-lg border px-2 py-1 transition-colors duration-300 ${
                    isWinner && winnerBlend > 0.5
                      ? "border-emerald-200 bg-emerald-50"
                      : focused
                        ? "border-sky-200 bg-white"
                        : "border-zinc-100 bg-zinc-50/90 opacity-60"
                  }`}
                  animate={
                    isWinner && settled
                      ? { boxShadow: "0 0 0 1.5px rgba(16,185,129,0.35)" }
                      : { boxShadow: "0 0 0 0px rgba(16,185,129,0)" }
                  }
                  transition={{ duration: 0.35, ease: DEMO_EASE }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p
                        className={`truncate text-[0.62rem] font-semibold ${
                          isWinner && winnerBlend > 0.5 ? "text-emerald-900" : "text-brand-ink"
                        }`}
                      >
                        {card.name}
                      </p>
                      {isWinner && winnerBlend > 0.6 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25, ease: DEMO_EASE }}
                          className="shrink-0 rounded bg-emerald-600 px-1 py-px text-[0.38rem] font-bold uppercase text-white"
                        >
                          Best
                        </motion.span>
                      )}
                    </div>
                    <p className="truncate text-[0.48rem] text-brand-muted">{card.rate}</p>
                  </div>
                  <p
                    className={`shrink-0 text-[0.62rem] font-bold tabular-nums ${
                      isWinner && winnerBlend > 0.5 ? "text-emerald-700" : "text-brand-muted"
                    }`}
                  >
                    {card.reward}
                  </p>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>

        {onWinner && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DEMO_MS.entrance / 1000, ease: DEMO_EASE }}
            className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2"
          >
            <p className="flex items-center gap-1.5 text-[0.58rem] leading-relaxed text-emerald-900">
              <Zap className="h-3 w-3 shrink-0 text-emerald-600" strokeWidth={2} />
              Charged to {winnerCard.name} — rewards on your existing account.
            </p>
          </motion.div>
        )}
      </FloatingPanel>
    </div>
  );
});

export const RouteSceneLayout = memo(function RouteSceneLayout({
  progress,
  compact = false,
  showAllRows = false,
  enlargeReady = false,
  enlargePressed = false,
  showCard = true,
}: {
  progress: number;
  compact?: boolean;
  showAllRows?: boolean;
  enlargeReady?: boolean;
  enlargePressed?: boolean;
  showCard?: boolean;
}) {
  const winnerBlend = routingWinnerBlend(progress);
  const showCardLayout = showCard && (!compact || winnerBlend > 0.4);

  return (
    <div
      className={`flex w-full items-center justify-center gap-3 ${
        compact ? "flex-col" : "flex-col sm:flex-row sm:gap-4"
      }`}
    >
      {showCardLayout && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DEMO_MS.entrance / 1000, ease: DEMO_EASE }}
          className="shrink-0"
        >
          <DemoOneCardVisual size={compact ? "xs" : "sm"} tiltY={-4} tiltX={2} />
        </motion.div>
      )}
      <div className="min-w-0 flex-1">
        <RoutingPanel
          progress={progress}
          compact={compact}
          showAllRows={showAllRows}
          enlargeReady={enlargeReady}
          enlargePressed={enlargePressed}
        />
      </div>
    </div>
  );
});
