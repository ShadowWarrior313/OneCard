"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type MouseEvent } from "react";
import { useUserProfile } from "@/context/UserProfileContext";

const STACK = [
  { label: "Dining", mult: "5×", from: "#312e81", to: "#6366f1", rotate: -14, y: 48, x: -32, scale: 0.88 },
  { label: "Travel", mult: "3×", from: "#0c4a6e", to: "#0891b2", rotate: 8, y: 32, x: 28, scale: 0.92 },
  { label: "Groceries", mult: "4×", from: "#14532d", to: "#22c55e", rotate: -4, y: 16, x: -8, scale: 0.96 },
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
}) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2"
      style={{ rotate, y, x, scale }}
      initial={{ opacity: 0, y: y + 40 }}
      animate={{ opacity: 0.85, y }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="aspect-[1.586] rounded-2xl p-4 text-white shadow-2xl ring-1 ring-white/10"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div className="h-5 w-8 rounded-md bg-gradient-to-br from-amber-200/90 to-amber-500/80" />
        <p className="mt-8 text-[0.6rem] font-medium uppercase tracking-wider text-white/60">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight">{mult}</p>
      </div>
    </motion.div>
  );
}

export function HeroCardStack() {
  const { cardholderName } = useUserProfile();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 120, damping: 20 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), spring);

  function onMove(e: MouseEvent) {
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
      className="relative mx-auto aspect-square w-full max-w-[420px]"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1200 }}
    >
      <div className="absolute inset-[10%] rounded-full bg-brand-purple/30 blur-[80px]" />
      <div className="absolute inset-[20%] rounded-full bg-brand-ocean/20 blur-[60px]" />

      {STACK.map((card, i) => (
        <MiniCard key={card.label} {...card} delay={0.15 + i * 0.1} />
      ))}

      <motion.div
        className="absolute left-1/2 top-1/2 z-20 w-[240px] -translate-x-1/2 -translate-y-1/2"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative aspect-[1.586] overflow-hidden rounded-[1.25rem] shadow-[0_32px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/20">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, #1a1a1c 0%, #0a0a0b 45%, #18181b 100%)",
            }}
          />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
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
