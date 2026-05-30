"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { STAGE_H, STAGE_W } from "./filmConfig";

/**
 * Scales the fixed STAGE_W × STAGE_H authoring box to fit a container.
 * - "width" mode: fill the container width (normal inline player).
 * - "contain" mode: fit fully inside width AND height (fullscreen letterbox).
 *
 * Returns the live scale factor. The stage is rendered at its native pixel size
 * and CSS-transformed by this scale, so a single transform drives all responsive
 * sizing and nothing inside ever reflows or clips.
 */
export function useFitToContainer(
  containerRef: RefObject<HTMLElement>,
  mode: "width" | "contain",
): number {
  const [scale, setScale] = useState(0.5);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const next =
        modeRef.current === "contain"
          ? Math.min(rect.width / STAGE_W, rect.height / STAGE_H)
          : rect.width / STAGE_W;
      setScale((prev) => (Math.abs(prev - next) > 0.0005 ? next : prev));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [containerRef, mode]);

  return scale;
}
