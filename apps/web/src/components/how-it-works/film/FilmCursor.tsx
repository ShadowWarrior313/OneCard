"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { CLICK_TIMES, CURSOR_KEYS, cursorField, sampleCursor } from "./cursorPath";

/** macOS-style arrow — black fill, white outline, hotspot at the tip. */
function ArrowCursor() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden style={{ display: "block" }}>
      <path
        d="M3.5 2L3.5 20.8C3.5 21.9 4.7 22.6 5.65 22.0L9.6 19.5L14.2 24.9C14.8 25.6 16.0 25.25 16.1 24.3L16.95 15.2L19.6 13.9C20.5 13.4 20.5 12.2 19.6 11.7L3.5 2Z"
        fill="#0B0B0F"
        stroke="white"
        strokeWidth="2.2"
        strokeLinejoin="round"
        style={{ paintOrder: "stroke fill" } as React.CSSProperties}
      />
    </svg>
  );
}

/** macOS-style pointing hand for clickable targets. */
function HandCursor() {
  return (
    <svg width="24" height="26" viewBox="0 0 24 26" fill="none" aria-hidden style={{ display: "block" }}>
      <path
        d="M9 11V4.5a1.6 1.6 0 013.2 0V10m0 0V8.4a1.6 1.6 0 013.2 0V11m0 0V9.6a1.6 1.6 0 013.1 0V15c0 3.6-2.2 7.2-6.4 7.2-2.4 0-3.8-1-5.2-2.8l-3-4.2c-.8-1.1.3-2.6 1.7-2.2l1.6.6V6.2a1.6 1.6 0 013.2 0V11"
        fill="#0B0B0F"
        stroke="white"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ paintOrder: "stroke fill" } as React.CSSProperties}
      />
    </svg>
  );
}

function ClickRipple({ timeMs, at }: { timeMs: MotionValue<number>; at: number }) {
  const x = sampleCursor("x", at);
  const y = sampleCursor("y", at);
  const opacity = useTransform(timeMs, [at - 10, at + 90, at + 380], [0, 0.55, 0], { clamp: true });
  const scale = useTransform(timeMs, [at - 10, at + 380], [0.3, 1.9], { clamp: true });
  return (
    <motion.span
      style={{ x, y, opacity, scale }}
      className="pointer-events-none absolute left-0 top-0 -ml-7 -mt-7 h-14 w-14 rounded-full ring-2 ring-brand-ocean"
      aria-hidden
    />
  );
}

/**
 * Guided OS cursor layer. Lives inside the (scaled) stage so its coordinates are
 * authoring pixels. Transform-only motion. Hides instantly on real mouse input,
 * and is never rendered under reduced motion.
 */
function FilmCursorBase({ timeMs, reducedMotion }: { timeMs: MotionValue<number>; reducedMotion: boolean }) {
  const [xi, xo] = cursorField("x");
  const [yi, yo] = cursorField("y");
  const [vi, vo] = cursorField("vis");
  const [hi, ho] = cursorField("hand");
  const [pi, po] = cursorField("press");
  const x = useTransform(timeMs, xi, xo);
  const y = useTransform(timeMs, yi, yo);
  const vis = useTransform(timeMs, vi, vo);
  const hand = useTransform(timeMs, hi, ho);
  const press = useTransform(timeMs, pi, po);

  const arrowO = useTransform(hand, [0, 1], [1, 0]);
  const pressScale = useTransform(press, [0, 1], [1, 0.86]);

  const [userMoved, setUserMoved] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = () => {
      setUserMoved(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setUserMoved(false), 2800);
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [reducedMotion]);

  if (reducedMotion || userMoved) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40" aria-hidden>
      {CLICK_TIMES.map((t) => (
        <ClickRipple key={t} timeMs={timeMs} at={t} />
      ))}
      <motion.div style={{ x, y, opacity: vis }} className="absolute left-0 top-0">
        <motion.div style={{ scale: pressScale }}>
          {/* arrow + hand crossfade for the OS pointer-state change */}
          <motion.div style={{ opacity: arrowO }} className="absolute left-0 top-0">
            <ArrowCursor />
          </motion.div>
          <motion.div style={{ opacity: hand }} className="absolute left-0 top-0">
            <HandCursor />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export const FilmCursor = memo(FilmCursorBase);
