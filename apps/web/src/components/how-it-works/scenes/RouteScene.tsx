"use client";

import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RouteSceneLayout } from "@/components/how-it-works/RoutingPanel";
import { routingWinnerBlend } from "@/components/how-it-works/demoDataCore";
import { DEMO_EASE } from "@/components/how-it-works/demoMotion";
import type { MockupFrameDensity } from "@/components/how-it-works/MockupFrame";

/** Zoom scale applied to the routing panel when the winner locks in. */
const ZOOM_IN_START = 0.82;
const ZOOM_IN_PEAK = 0.87;
const ZOOM_OUT_END = 0.95;

const CURSOR_CLICK_START = 0.80;
const CURSOR_CLICK_END = 0.84;

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
    const duration = reducedMotion ? 0 : 5200;

    function tick(now: number) {
      if (start == null) start = now;
      const t = duration <= 0 ? 0.88 : ((now - start) % duration) / duration;
      setLoop(t < 0.12 ? 0.88 : t);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [density, progress, reducedMotion]);

  return density === "player" ? progress : loop;
}

function zoomScale(p: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  if (p < ZOOM_IN_START) return 1;
  if (p < ZOOM_IN_PEAK) {
    const t = (p - ZOOM_IN_START) / (ZOOM_IN_PEAK - ZOOM_IN_START);
    return 1 + t * 0.055;
  }
  if (p < ZOOM_OUT_END) {
    const t = (p - ZOOM_IN_PEAK) / (ZOOM_OUT_END - ZOOM_IN_PEAK);
    return 1.055 - t * 0.055;
  }
  return 1;
}

export const RouteScene = memo(function RouteScene({
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
  const sceneProgress = density === "player" && !animReady ? 0 : raw;

  const winnerBlend = routingWinnerBlend(sceneProgress);
  const onWinner = winnerBlend > 0.75;

  const clicking =
    sceneProgress >= CURSOR_CLICK_START && sceneProgress < CURSOR_CLICK_END;

  const zoom = density === "player" ? zoomScale(sceneProgress, reducedMotion) : 1;

  const body = (
    <RouteSceneLayout
      progress={sceneProgress}
      compact={density !== "player"}
      showAllRows={density === "modal"}
      enlargeReady={onWinner}
      enlargePressed={clicking}
    />
  );

  if (density !== "player") {
    return body;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="w-full"
        animate={{ scale: zoom }}
        transition={{ duration: 0.55, ease: DEMO_EASE }}
        style={{ transformOrigin: "center center" }}
      >
        {body}
      </motion.div>
    </div>
  );
});
