"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useUserProfile } from "@/context/UserProfileContext";

const STACK_DESKTOP = [
  { label: "Dining", mult: "5×", from: "#1e293b", to: "#334155", rotate: -10, y: 36, x: -18, scale: 0.88 },
  { label: "Travel", mult: "3×", from: "#0f172a", to: "#1e3a5f", rotate: 6, y: 24, x: 16, scale: 0.92 },
  { label: "Groceries", mult: "4×", from: "#14532d", to: "#166534", rotate: -3, y: 12, x: -4, scale: 0.96 },
];

const STACK_MOBILE = [
  { label: "Dining", mult: "5×", from: "#1e293b", to: "#334155", rotate: -7, y: 32, x: -12, scale: 0.9 },
  { label: "Travel", mult: "3×", from: "#0f172a", to: "#1e3a5f", rotate: 5, y: 20, x: 10, scale: 0.93 },
  { label: "Groceries", mult: "4×", from: "#14532d", to: "#166534", rotate: -2, y: 10, x: -3, scale: 0.96 },
];

function MiniCard({
  label,
  mult,
  from,
  to,
  rotate,
  y,
  x,
  scale,
  delay,
  compact,
}: {
  label: string;
  mult: string;
  from: string;
  to: string;
  rotate: number;
  y: number;
  x: number;
  scale: number;
  delay: number;
  compact: boolean;
}) {
  return (
    <motion.div
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
        compact ? "w-[82%] max-w-[200px]" : "w-[220px]"
      }`}
      style={{ rotate, y, x, scale }}
      initial={{ opacity: 0, y: y + 40 }}
      animate={{ opacity: 0.9, y }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="aspect-[1.586] rounded-2xl p-4 text-white shadow-xl ring-1 ring-white/10"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div className="h-5 w-8 rounded-md bg-gradient-to-br from-amber-200/90 to-amber-500/80" />
        <p className="mt-8 text-[0.6rem] font-medium uppercase tracking-wider text-white/55">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight">{mult}</p>
      </div>
    </motion.div>
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
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 120, damping: 20 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], compact ? [0, 0] : [8, -8]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], compact ? [0, 0] : [-10, 10]), spring);
  const stack = compact ? STACK_MOBILE : STACK_DESKTOP;

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

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-square w-full max-w-[420px] overflow-visible"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1200 }}
    >
      <div className="pointer-events-none absolute inset-[12%] rounded-full bg-white/[0.04] blur-[70px]" />

      {stack.map((card, i) => (
        <MiniCard key={card.label} {...card} delay={0.15 + i * 0.1} compact={compact} />
      ))}

      <motion.div
        className={`absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 ${
          compact ? "w-[88%] max-w-[216px]" : "w-[240px]"
        }`}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative aspect-[1.586] overflow-hidden rounded-[1.25rem] shadow-[0_24px_64px_rgba(0,0,0,0.45)] ring-1 ring-white/15">
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
    </div>
  );
}
