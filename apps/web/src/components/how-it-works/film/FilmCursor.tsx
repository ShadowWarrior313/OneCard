"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { CLICK_TIMES, cursorField, sampleCursor } from "./cursorPath";

/**
 * Classic solid-black arrow pointer. Hotspot at the tip (~4,2).
 * A thin white edge keeps it crisp on any background.
 */
function ArrowCursor() {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none" aria-hidden style={{ display: "block" }}>
      <path
        d="M4 2 L4 23.5 L9.9 18 L13.4 25.6 L16.7 24.1 L13.2 16.7 L20.4 16.7 Z"
        fill="#0b0b0f"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Classic pointing-hand (link) cursor — white fill, black outline,
 * index finger up. Hotspot at the fingertip (~10,3).
 */
function HandCursor() {
  return (
    <svg width="30" height="32" viewBox="0 0 30 32" fill="none" aria-hidden style={{ display: "block" }}>
      <path
        d="M10 12V5.4a2 2 0 0 1 4 0V11.2
           m0-1.4a2 2 0 0 1 4 0V11.6
           m0-1a2 2 0 0 1 3.9 0V12.6
           m0-.6a1.9 1.9 0 0 1 3.8 0V17.6c0 3.7-2.6 6.7-6.7 6.7h-2.6c-2 0-3.2-.9-4.2-2.5l-2.9-4.7c-.6-.9-.3-2.1.7-2.6 1.1-.5 2.4-.1 3 .9L10 17.5"
        fill="#ffffff"
        stroke="#0b0b0f"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClickRipple({ timeMs, at }: { timeMs: MotionValue<number>; at: number }) {
  const x = sampleCursor("x", at);
  const y = sampleCursor("y", at);
  const opacity = useTransform(timeMs, [at - 10, at + 80, at + 360], [0, 0.6, 0], { clamp: true });
  const scale = useTransform(timeMs, [at - 10, at + 360], [0.25, 1.9], { clamp: true });
  return (
    <motion.span
      style={{ x, y, opacity, scale }}
      className="pointer-events-none absolute left-0 top-0 -ml-7 -mt-7 h-14 w-14 rounded-full ring-[3px] ring-brand-ocean"
      aria-hidden
    />
  );
}

/**
 * Guided OS cursor layer. Lives in stage coords (not zoomed by the camera).
 * Transform-only motion. Hides on real mouse input; never rendered under
 * reduced motion. The path coordinates point at the CENTRE of each target.
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
  const pressScale = useTransform(press, [0, 1], [1, 0.84]);

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
          {/* arrow hotspot at (4,2); hand fingertip hotspot at (10,3) */}
          <motion.div style={{ opacity: arrowO, x: -4, y: -2 }} className="absolute left-0 top-0">
            <ArrowCursor />
          </motion.div>
          <motion.div style={{ opacity: hand, x: -10, y: -3 }} className="absolute left-0 top-0">
            <HandCursor />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export const FilmCursor = memo(FilmCursorBase);
