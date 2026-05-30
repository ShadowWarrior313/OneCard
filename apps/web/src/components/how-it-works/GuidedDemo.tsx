"use client";

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";
import { DEMO_EASE, DEMO_MS } from "@/components/how-it-works/demoMotion";

export type GuidedPoint = { x: number; y: number };

export type GuidedStep = {
  /** Chapter-local progress 0–1 */
  at: number;
  point: GuidedPoint;
  click?: boolean;
};

type GuidedDemoContextValue = {
  userActive: boolean;
  pulseTarget: (id: string) => void;
};

const GuidedDemoContext = createContext<GuidedDemoContextValue | null>(null);

export function useGuidedDemo() {
  return useContext(GuidedDemoContext);
}

function lerpPoint(a: GuidedPoint, b: GuidedPoint, t: number): GuidedPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function pointAtProgress(steps: GuidedStep[], progress: number): GuidedPoint {
  if (steps.length === 0) return { x: 50, y: 50 };
  if (progress <= steps[0]!.at) return steps[0]!.point;
  for (let i = 0; i < steps.length - 1; i++) {
    const a = steps[i]!;
    const b = steps[i + 1]!;
    if (progress >= a.at && progress <= b.at) {
      const t = b.at === a.at ? 1 : (progress - a.at) / (b.at - a.at);
      const eased = t * t * (3 - 2 * t);
      return lerpPoint(a.point, b.point, eased);
    }
  }
  return steps[steps.length - 1]!.point;
}

function CursorSvg() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden>
      <path
        d="M4 2.5L4 20.5C4 21.6 5.2 22.3 6.1 21.7L10.2 19L14.8 24.2C15.4 24.9 16.6 24.5 16.7 23.5L17.5 14.5L19.8 13.2C20.7 12.7 20.7 11.3 19.8 10.8L4 2.5Z"
        fill="white"
        stroke="#0B0B0F"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const GuidedDemo = memo(function GuidedDemo({
  children,
  enabled = true,
  steps = [],
  progress = 0,
  zoom = 1,
  zoomOrigin = "50% 55%",
  className = "",
}: {
  children: ReactNode;
  enabled?: boolean;
  steps?: GuidedStep[];
  progress?: number;
  zoom?: number;
  zoomOrigin?: string;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const active = enabled && !reducedMotion && steps.length > 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const [userActive, setUserActive] = useState(false);
  const [ripple, setRipple] = useState<GuidedPoint | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const lastClickAt = useRef(-1);

  const cursorPoint = useMemo(() => pointAtProgress(steps, progress), [steps, progress]);

  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    if (!root) return;

    function onUser() {
      setUserActive(true);
    }

    root.addEventListener("pointerdown", onUser, { once: true });
    root.addEventListener("pointermove", onUser, { once: true });
    return () => {
      root.removeEventListener("pointerdown", onUser);
      root.removeEventListener("pointermove", onUser);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const clickStep = steps.find((s) => s.click && Math.abs(s.at - progress) < 0.025);
    if (clickStep && lastClickAt.current !== clickStep.at) {
      lastClickAt.current = clickStep.at;
      setRipple(clickStep.point);
      const id = window.setTimeout(() => setRipple(null), 420);
      return () => window.clearTimeout(id);
    }
  }, [active, progress, steps]);

  const pulseTarget = useCallback((id: string) => {
    setPressedId(id);
    window.setTimeout(() => setPressedId(null), 220);
  }, []);

  const ctx = useMemo(
    (): GuidedDemoContextValue => ({ userActive, pulseTarget }),
    [userActive, pulseTarget],
  );

  const showCursor = active && !userActive;

  return (
    <GuidedDemoContext.Provider value={ctx}>
      <div ref={rootRef} className={`relative ${className}`.trim()}>
        <motion.div
          className="relative h-full w-full"
          initial={false}
          animate={{ scale: zoom }}
          transition={{ duration: DEMO_MS.zoom / 1000, ease: DEMO_EASE }}
          style={{ transformOrigin: zoomOrigin }}
        >
          {children}
        </motion.div>

        {showCursor && (
          <motion.div
            className="pointer-events-none absolute z-50"
            initial={false}
            animate={{
              left: `${cursorPoint.x}%`,
              top: `${cursorPoint.y}%`,
            }}
            transition={{ duration: DEMO_MS.guidedMove / 1000, ease: DEMO_EASE }}
            style={{ translate: "-8% -5%" }}
            aria-hidden
          >
            <CursorSvg />
          </motion.div>
        )}

        <AnimatePresence>
          {ripple && showCursor && (
            <motion.span
              key={`${ripple.x}-${ripple.y}`}
              className="pointer-events-none absolute z-40 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/25 ring-2 ring-sky-400/50"
              style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
              initial={{ opacity: 0.7, scale: 0.35 }}
              animate={{ opacity: 0, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.42, ease: DEMO_EASE }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        {pressedId && (
          <span className="sr-only" aria-live="polite">
            Guided interaction on {pressedId}
          </span>
        )}
      </div>
    </GuidedDemoContext.Provider>
  );
});

/** Press + highlight wrapper for guided click targets */
export function GuidedTarget({
  id,
  children,
  className = "",
  highlight = false,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  const guided = useGuidedDemo();

  return (
    <motion.div
      data-guided-target={id}
      className={className}
      initial={false}
      animate={{
        scale: guided?.userActive ? 1 : highlight ? 1 : 1,
      }}
      whileTap={guided?.userActive ? undefined : { scale: 0.97 }}
      style={{
        boxShadow: highlight ? "0 0 0 2px rgba(56, 189, 248, 0.45)" : undefined,
      }}
    >
      {children}
    </motion.div>
  );
}

export function MockupScreenTransition({
  screenKey,
  children,
  className = "",
}: {
  screenKey: string;
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`.trim()}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screenKey}
          className="h-full w-full"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: DEMO_MS.screen / 1000, ease: DEMO_EASE }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
