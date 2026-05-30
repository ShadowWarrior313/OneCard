"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { DemoOneCardVisual } from "@/components/how-it-works/DemoOneCardVisual";
import { SCENE_EASE } from "@/components/how-it-works/SceneTransition";

const WORDS = ["One wallet.", "One tap.", "Smarter every time."] as const;

export const IntroScene = memo(function IntroScene({
  progress,
  reducedMotion = false,
  animReady = true,
}: {
  progress: number;
  reducedMotion?: boolean;
  animReady?: boolean;
}) {
  const showCard = progress > 0.52;
  const wordIndex = reducedMotion
    ? Math.min(WORDS.length - 1, Math.floor(progress * WORDS.length))
    : Math.min(WORDS.length - 1, Math.floor(progress * 3.2));

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4 text-center">
      {!showCard ? (
        <div className="space-y-2 sm:space-y-3">
          {WORDS.map((word, i) => (
            <motion.p
              key={word}
              initial={false}
              animate={{
                opacity: animReady && i <= wordIndex ? 1 : i <= wordIndex ? 0.85 : 0,
                y: reducedMotion || !animReady ? 0 : i <= wordIndex ? 0 : 14,
                filter:
                  reducedMotion || !animReady
                    ? "blur(0px)"
                    : i <= wordIndex
                      ? "blur(0px)"
                      : "blur(4px)",
              }}
              transition={{
                duration: reducedMotion ? 0 : 0.5,
                ease: SCENE_EASE,
                delay: reducedMotion ? 0 : i * 0.04,
              }}
              className="text-xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
            >
              {word}
            </motion.p>
          ))}
        </div>
      ) : (
        <motion.div
          initial={false}
          animate={
            animReady
              ? { opacity: 1, y: 0, scale: 1 }
              : reducedMotion
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 16, scale: 0.92 }
          }
          transition={{ duration: reducedMotion ? 0 : 0.6, ease: SCENE_EASE }}
          className="flex flex-col items-center"
        >
          <DemoOneCardVisual size="lg" tiltX={-6} tiltY={4} specular={animReady} />
        </motion.div>
      )}
    </div>
  );
});

export function OutroScene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.45, ease: SCENE_EASE }}
        className="flex flex-col items-center gap-3"
      >
        <DemoOneCardVisual size="md" tiltX={-4} tiltY={3} />
        <p className="max-w-xs text-sm text-zinc-400">Tap once. Route smarter. Earn more.</p>
      </motion.div>
    </div>
  );
}
