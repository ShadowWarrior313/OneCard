"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useUserProfile } from "@/context/UserProfileContext";

/** Wallet-style deck — each layer peeks ~12% so ~88–90% of the card behind stays visible */
const DECK = [
  { from: "#14532d", to: "#166534" },
  { from: "#0f172a", to: "#1e3a5f" },
  { from: "#7f1d1d", to: "#991b1b" },
  { from: "#1e3a8a", to: "#2563eb" },
  { from: "#4c1d95", to: "#6d28d9" },
  { from: "#1e293b", to: "#334155" },
] as const;

const STAGE_W = 400;
const STAGE_H = 420;

function deckLayout() {
  const peekY = 13;
  const peekX = 4;
  const count = DECK.length;

  return DECK.map((card, i) => {
    const depthFromFront = count - 1 - i;
    return {
      ...card,
      y: depthFromFront * peekY + 14,
      x: -depthFromFront * peekX,
      rotate: depthFromFront * 1.75 - 4.5,
      scale: 0.875 + (i / (count - 1)) * 0.1,
      zIndex: i + 1,
      delay: 0.08 + i * 0.07,
    };
  });
}

function DeckCard({
  from,
  to,
  y,
  x,
  rotate,
  scale,
  zIndex,
  delay,
}: {
  from: string;
  to: string;
  y: number;
  x: number;
  rotate: number;
  scale: number;
  zIndex: number;
  delay: number;
}) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ zIndex }}
    >
      <motion.div
        className="w-[220px]"
        style={{ rotate, scale }}
        initial={{ opacity: 0, y: y + 32, x, scale: scale * 0.92 }}
        animate={{ opacity: 1, y, x, scale }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="aspect-[1.586] rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.12]"
          style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
        >
          <div className="h-5 w-8 rounded-md bg-gradient-to-br from-amber-200/90 to-amber-500/80 shadow-inner" />
          <div className="mt-auto flex items-end justify-end pt-10">
            <span className="flex gap-0.5 opacity-80">
              <span className="h-3.5 w-3.5 rounded-full bg-red-500/90" />
              <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-amber-400/90" />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function useCompactHero() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return compact;
}

export function HeroCardStack() {
  const { cardholderName } = useUserProfile();
  const compact = useCompactHero();
  const deck = useMemo(() => deckLayout(), []);
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 120, damping: 20 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], compact ? [0, 0] : [6, -6]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], compact ? [0, 0] : [-8, 8]), spring);

  function onMove(e: MouseEvent) {
    if (compact) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  const heroLift = -20;

  return (
    <div className="flex w-full justify-center overflow-visible py-2 sm:py-0">
      {/* Shrink-wrap: reserves scaled size on mobile so nothing overflows right */}
      <div className="relative h-[328px] w-[312px] shrink-0 overflow-visible sm:h-[420px] sm:w-[400px]">
        <div
          className="absolute left-1/2 top-0 origin-top -translate-x-1/2 scale-[0.78] sm:relative sm:left-0 sm:top-0 sm:translate-x-0 sm:scale-100"
          style={{ width: STAGE_W, height: STAGE_H }}
        >
          <div
            ref={ref}
            className="relative overflow-visible"
            style={{ width: STAGE_W, height: STAGE_H, perspective: 1200 }}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
          >
          <div className="pointer-events-none absolute inset-[10%] rounded-full bg-white/[0.05] blur-[80px]" />

          {deck.map((card, i) => (
            <DeckCard key={i} {...card} />
          ))}

          {/* Selected card — centred via wrapper; motion only on inner div */}
          <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="w-[240px]"
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              initial={{ opacity: 0, y: heroLift + 24, scale: 0.94 }}
              animate={{ y: heroLift, scale: 1, opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="relative aspect-[1.586] overflow-hidden rounded-[1.25rem] shadow-[0_28px_72px_rgba(0,0,0,0.55)] ring-2 ring-white/20">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(145deg, #1a1a1c 0%, #0a0a0b 45%, #18181b 100%)",
                    }}
                  />
                  <div className="relative flex h-full flex-col justify-between p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div className="h-6 w-9 rounded-md bg-gradient-to-br from-amber-200/95 to-amber-500/90 shadow-inner" />
                      <span className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-white/40">
                        OneCard
                      </span>
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white/45">
                        Universal wallet
                      </p>
                      <p className="mt-1 text-lg font-semibold tracking-wide">{cardholderName}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="font-mono text-[0.65rem] text-white/35">•••• 4821</span>
                      <span className="flex gap-0.5">
                        <span className="h-4 w-4 rounded-full bg-red-500/90" />
                        <span className="-ml-2 h-4 w-4 rounded-full bg-amber-400/90" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
