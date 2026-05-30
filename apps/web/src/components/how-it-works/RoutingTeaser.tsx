"use client";

import { memo, useEffect, useState } from "react";
import { MockupScreenTransition } from "@/components/how-it-works/GuidedDemo";
import { RouteSceneLayout } from "@/components/how-it-works/RoutingPanel";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";

/** Bento teaser: compact looping tap → detect → winner locks */
export const RoutingTeaser = memo(function RoutingTeaser() {
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(reducedMotion ? 0.88 : 0.15);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    let start: number | null = null;
    const duration = 4800;

    function tick(now: number) {
      if (start == null) start = now;
      const t = ((now - start) % duration) / duration;
      setProgress(0.12 + t * 0.82);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const screenKey = progress < 0.35 ? "detect" : progress < 0.72 ? "compare" : "winner";

  return (
    <div className="flex h-full w-full items-center justify-center px-1 py-2">
      <MockupScreenTransition screenKey={screenKey} className="w-full max-w-[18rem]">
        <RouteSceneLayout progress={progress} compact />
      </MockupScreenTransition>
    </div>
  );
});
