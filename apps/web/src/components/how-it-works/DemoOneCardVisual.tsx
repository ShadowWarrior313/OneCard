"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { DemoOneCard } from "@/components/demo/DemoOneCard";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";
import { DEMO_EASE } from "@/components/how-it-works/demoMotion";

/** Scales from homepage showcase (220px wide). */
export type DemoCardSize = "xs" | "sm" | "md" | "lg";

const CARD_SCALE: Record<DemoCardSize, number> = {
  xs: 0.52,
  sm: 0.66,
  md: 0.82,
  lg: 1,
};

/**
 * Canonical homepage OneCard — uniform scale only; visual identity from OneCardFace.
 * Optional tilt + specular sweep for demo motion (does not alter card art).
 */
export const DemoOneCardVisual = memo(function DemoOneCardVisual({
  size = "md",
  tiltX = 0,
  tiltY = 0,
  specular = false,
  className = "",
}: {
  size?: DemoCardSize;
  tiltX?: number;
  tiltY?: number;
  specular?: boolean;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const scale = CARD_SCALE[size];

  return (
    <motion.div
      className={`relative max-w-full shrink-0 ${className}`.trim()}
      style={{
        transform: `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        transformStyle: "preserve-3d",
      }}
      initial={false}
    >
      <DemoOneCard scale={scale} />
      {specular && !reducedMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.15rem]"
          aria-hidden
        >
          <motion.div
            className="absolute inset-y-0 w-[45%] opacity-25"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
            }}
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: DEMO_EASE, repeatDelay: 1.2 }}
          />
        </motion.div>
      )}
    </motion.div>
  );
});
