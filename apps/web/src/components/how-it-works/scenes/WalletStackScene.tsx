"use client";

import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Shield } from "lucide-react";
import { DemoOneCardVisual } from "@/components/how-it-works/DemoOneCardVisual";
import { DEMO_EASE, DEMO_MS } from "@/components/how-it-works/demoMotion";

const PAN = "4821 7390 2846 4821";
const MASK = "•••• •••• •••• ••••";
const TOKEN = "tok_8f2a…4821";

type TokenPhase = "pan" | "masking" | "token";

const FAN = [
  { x: -24, y: -5, rotate: -11, z: 1 },
  { x: 24, y: -5, rotate: 11, z: 2 },
  { x: 0, y: 12, rotate: 0, z: 3 },
] as const;

export const WalletStackScene = memo(function WalletStackScene({
  reducedMotion = false,
  animReady = true,
  density = "card",
}: {
  reducedMotion?: boolean;
  animReady?: boolean;
  density?: "card" | "modal" | "player";
}) {
  const [collapsed, setCollapsed] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion || !animReady) {
      setCollapsed(true);
      return;
    }

    setCollapsed(false);
    const id = window.setTimeout(() => setCollapsed(true), 2000);
    return () => window.clearTimeout(id);
  }, [reducedMotion, animReady]);

  const cardSize = density === "modal" ? "sm" : "xs";

  return (
    <div className="flex h-full w-full items-center justify-center py-2">
      <div
        className={`relative flex items-center justify-center ${
          density === "modal" ? "h-[8.5rem] w-[11rem]" : "h-[7rem] w-[9.5rem]"
        }`}
      >
        {FAN.map((o, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 will-change-transform"
            initial={false}
            animate={
              collapsed
                ? { x: "-50%", y: "-50%", rotate: 0, opacity: 0, scale: 0.85 }
                : {
                    x: `calc(-50% + ${o.x}px)`,
                    y: `calc(-50% + ${o.y}px)`,
                    rotate: o.rotate,
                    opacity: 1,
                    scale: 0.94,
                  }
            }
            transition={{
              duration: reducedMotion ? 0 : 0.52,
              delay: reducedMotion ? 0 : i * 0.06,
              ease: DEMO_EASE,
            }}
            style={{ zIndex: o.z }}
          >
            <DemoOneCardVisual size={cardSize} />
          </motion.div>
        ))}

        <motion.div
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 will-change-transform"
          initial={false}
          animate={{
            opacity: collapsed ? 1 : 0,
            scale: collapsed ? 1 : 0.88,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.48, ease: DEMO_EASE }}
        >
          <DemoOneCardVisual
            size={density === "modal" ? "md" : "sm"}
            tiltY={-4}
            tiltX={3}
            specular={animReady && collapsed}
          />
        </motion.div>
      </div>
    </div>
  );
});

export const TokenScene = memo(function TokenScene({
  reducedMotion = false,
  animReady = true,
  density = "card",
}: {
  reducedMotion?: boolean;
  animReady?: boolean;
  density?: "card" | "modal";
}) {
  const [phase, setPhase] = useState<TokenPhase>(reducedMotion ? "token" : "pan");

  useEffect(() => {
    if (reducedMotion || !animReady) {
      setPhase("token");
      return;
    }

    function cycle() {
      setPhase("pan");
      window.setTimeout(() => setPhase("masking"), 1200);
      window.setTimeout(() => setPhase("token"), 2000);
    }

    cycle();
    const id = window.setInterval(cycle, 4800);
    return () => window.clearInterval(id);
  }, [reducedMotion, animReady]);

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center gap-3 py-2 ${
        density === "modal" ? "min-h-[14rem]" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #0B0B0F 0, #0B0B0F 1px, transparent 1px, transparent 10px)",
        }}
      />

      <Shield className="h-7 w-7 text-sky-600/40" strokeWidth={1.25} aria-hidden />

      <div className="w-[19rem] max-w-full rounded-2xl bg-zinc-900 px-4 py-4 ring-1 ring-zinc-700">
        <p className="text-[0.45rem] font-semibold uppercase tracking-wider text-zinc-500">
          Card number
        </p>
        <div className="relative mx-auto mt-2 h-[1.25rem] w-[17.5rem] max-w-full">
          {[PAN, MASK, TOKEN].map((text, i) => {
            const active =
              (phase === "pan" && i === 0) ||
              (phase === "masking" && i === 1) ||
              (phase === "token" && i === 2);
            return (
              <motion.p
                key={text}
                className="absolute inset-0 whitespace-nowrap font-mono text-[clamp(0.65rem,2.6vw,0.875rem)] font-semibold tabular-nums tracking-[0.06em] text-white"
                initial={false}
                animate={{
                  opacity: active ? 1 : 0,
                  y: active ? 0 : 4,
                }}
                transition={{ duration: reducedMotion ? 0 : 0.35, ease: DEMO_EASE }}
              >
                {text}
              </motion.p>
            );
          })}
        </div>
        <motion.p
          initial={false}
          animate={{ opacity: phase === "token" ? 1 : 0, y: phase === "token" ? 0 : 4 }}
          transition={{ duration: reducedMotion ? 0 : 0.35, ease: DEMO_EASE }}
          className="mt-3 flex items-center gap-1 text-[0.55rem] font-medium text-emerald-400"
        >
          <Lock className="h-3 w-3 shrink-0" />
          Tokenized — never stored on our servers
        </motion.p>
      </div>

      <DemoOneCardVisual size={density === "modal" ? "sm" : "xs"} />
    </div>
  );
});
