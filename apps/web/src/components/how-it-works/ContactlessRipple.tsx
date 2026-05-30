"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";

export function ContactlessRipple({
  active,
  className = "",
  style,
}: {
  active: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const reducedMotion = usePrefersReducedMotion();
  if (!active || reducedMotion) return null;

  return (
    <div className={`pointer-events-none absolute ${className}`.trim()} style={style} aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/50"
          initial={{ opacity: 0.6, scale: 0.5 }}
          animate={{ opacity: 0, scale: 2.4 + i * 0.5 }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
