"use client";

import { memo, type ReactNode } from "react";
import { motion } from "framer-motion";

export const SCENE_EASE = [0.22, 1, 0.36, 1] as const;
export const SCENE_TRANSITION_MS = 500;

/** Keep scenes mounted; crossfade with transform/opacity only. */
export const SceneLayer = memo(function SceneLayer({
  active,
  reducedMotion,
  children,
  className = "",
}: {
  active: boolean;
  reducedMotion: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`absolute inset-0 ${className}`.trim()}
      initial={false}
      animate={
        reducedMotion
          ? { opacity: active ? 1 : 0, y: 0, pointerEvents: active ? "auto" : "none" }
          : {
              opacity: active ? 1 : 0,
              y: active ? 0 : 8,
              pointerEvents: active ? "auto" : "none",
            }
      }
      transition={{
        duration: reducedMotion ? 0 : SCENE_TRANSITION_MS / 1000,
        ease: SCENE_EASE,
      }}
      style={{
        willChange: active && !reducedMotion ? "transform, opacity" : undefined,
      }}
      aria-hidden={!active}
    >
      {children}
    </motion.div>
  );
});

export const SceneBackdrop = memo(function SceneBackdrop({
  variant,
  className = "",
}: {
  variant: "cinematic" | "sky";
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`.trim()}
      aria-hidden
      style={{
        background:
          variant === "cinematic"
            ? "linear-gradient(165deg, #0B0B0F 0%, #13131A 60%, #0D1423 100%)"
            : "linear-gradient(165deg, #EAF5FE 0%, #D5EAF9 55%, #C8E3F7 100%)",
      }}
    >
      {/* Subtle noise grain */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {variant === "cinematic" && (
        /* Star-like soft vignette on cinematic backdrop */
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(56,189,248,0.35), transparent 65%)",
          }}
        />
      )}
    </div>
  );
});

/** @deprecated use SceneLayer — kept for backdrop imports */
export function SceneTransition({
  sceneKey: _sceneKey,
  reducedMotion,
  children,
  className = "",
}: {
  sceneKey: string;
  reducedMotion: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SceneLayer active reducedMotion={reducedMotion} className={className}>
      {children}
    </SceneLayer>
  );
}
