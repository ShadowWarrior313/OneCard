"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ContactlessRipple } from "@/components/how-it-works/ContactlessRipple";
import { DemoOneCardVisual } from "@/components/how-it-works/DemoOneCardVisual";
import { PosTerminal } from "@/components/how-it-works/PosTerminal";
import { SCENE_EASE } from "@/components/how-it-works/SceneTransition";

function tapPhase(progress: number) {
  if (progress < 0.2) return "idle";
  if (progress < 0.55) return "approach";
  if (progress < 0.72) return "contact";
  return "approved";
}

export const TapScene = memo(function TapScene({
  progress,
  reducedMotion = false,
  animReady = true,
}: {
  progress: number;
  reducedMotion?: boolean;
  animReady?: boolean;
}) {
  const phase = reducedMotion ? (progress >= 0.72 ? "approved" : "idle") : tapPhase(progress);
  const approved = phase === "approved";
  const contact = phase === "contact";
  const approachT = Math.max(0, Math.min(1, (progress - 0.2) / 0.35));

  const cardY = reducedMotion
    ? approved
      ? 10
      : -10
    : phase === "idle"
      ? -14
      : phase === "approach"
        ? -14 + approachT * 22
        : 10;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="relative flex flex-col items-center">
        <div className="relative z-10 -mb-3 sm:-mb-4">
          {animReady && contact && (
            <ContactlessRipple
              active
              className="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
            />
          )}
          <motion.div
            initial={false}
            animate={{ y: cardY }}
            transition={{ duration: reducedMotion ? 0 : 0.55, ease: SCENE_EASE }}
          >
            <DemoOneCardVisual
              size="sm"
              tiltX={-4}
              tiltY={2}
              specular={animReady && !contact}
            />
          </motion.div>
        </div>

        <div className="relative z-0">
          <PosTerminal approved={approved} reducedMotion={reducedMotion} />
        </div>
      </div>
    </div>
  );
});
