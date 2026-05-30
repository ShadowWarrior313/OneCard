"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { OneCardFace } from "@/components/OneCardFace";

/**
 * Scene 5 — Cinematic close on the OneCard with a wordmark + tagline.
 * Holds at the end as the freeze/poster frame for the Replay button.
 */
function ClosingSceneBase({ timeMs }: { timeMs: MotionValue<number> }) {
  const cardO = useTransform(timeMs, [39200, 40000], [0, 1], { clamp: true });
  const cardScale = useTransform(timeMs, [39200, 41200], [0.9, 1], { clamp: true });
  const cardY = useTransform(timeMs, [39200, 41200], [16, 0], { clamp: true });
  const glowO = useTransform(timeMs, [39600, 41200], [0, 1], { clamp: true });

  const markO = useTransform(timeMs, [40600, 41400], [0, 1], { clamp: true });
  const markY = useTransform(timeMs, [40600, 41400], [14, 0], { clamp: true });
  const tagO = useTransform(timeMs, [41200, 42200], [0, 1], { clamp: true });
  const tagY = useTransform(timeMs, [41200, 42200], [12, 0], { clamp: true });

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b0b0f] via-[#0a0a0d] to-[#111119]">
      <motion.div style={{ opacity: glowO }} className="absolute left-1/2 top-1/2 h-[360px] w-[520px] -translate-x-1/2 -translate-y-[58%] rounded-full bg-brand-ocean/15 blur-3xl" />

      <motion.div style={{ opacity: cardO, scale: cardScale, y: cardY }} className="w-[300px]">
        <OneCardFace />
      </motion.div>

      <motion.p style={{ opacity: markO, y: markY }} className="mt-9 text-[30px] font-extrabold tracking-tight text-white">
        OneCard
      </motion.p>
      <motion.p style={{ opacity: tagO, y: tagY }} className="mt-1.5 text-[16px] font-medium text-white/55">
        One tap. Smarter every time.
      </motion.p>
    </div>
  );
}

export const ClosingScene = memo(ClosingSceneBase);
