"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_EASE } from "@/components/how-it-works/demoMotion";

export type CursorPoint = { x: number; y: number };

/** macOS-style black arrow with white outline, hotspot at tip. */
function OsArrowCursor() {
  return (
    <svg
      width="22"
      height="26"
      viewBox="0 0 22 26"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* White outline rendered first (paint-order: stroke fill on inner path) */}
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

export const DemoSystemCursor = memo(function DemoSystemCursor({
  visible,
  point,
  clicking = false,
  reducedMotion = false,
}: {
  visible: boolean;
  point: CursorPoint;
  clicking?: boolean;
  reducedMotion?: boolean;
}) {
  const [userMoved, setUserMoved] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!visible) {
      setUserMoved(false);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      return;
    }

    function handleMove() {
      setUserMoved(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setUserMoved(false), 2800);
    }

    document.addEventListener("mousemove", handleMove);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [visible]);

  const shouldShow = visible && !userMoved && !reducedMotion;

  return (
    <>
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            key="os-cursor"
            className="pointer-events-none absolute z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, left: `${point.x}%`, top: `${point.y}%` }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.2, ease: DEMO_EASE }, left: { duration: 0.65, ease: DEMO_EASE }, top: { duration: 0.65, ease: DEMO_EASE } }}
            style={{ translate: "-3px -2px" }}
            aria-hidden
          >
            <motion.div
              animate={{ scale: clicking ? 0.88 : 1 }}
              transition={{ duration: 0.14, ease: DEMO_EASE }}
            >
              <OsArrowCursor />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shouldShow && clicking && (
          <motion.span
            key={`ripple-${point.x}-${point.y}`}
            className="pointer-events-none absolute z-[59] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/15 ring-1 ring-sky-500/30"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            initial={{ opacity: 0.7, scale: 0.3 }}
            animate={{ opacity: 0, scale: 1.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36, ease: DEMO_EASE }}
            aria-hidden
          />
        )}
      </AnimatePresence>
    </>
  );
});
