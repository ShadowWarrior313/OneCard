"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const SLIDE_SPRING = { type: "spring" as const, stiffness: 420, damping: 38 };

export type SlideDirection = "forward" | "back";

const variants = {
  enter: (dir: SlideDirection) => ({
    x: dir === "forward" ? "100%" : "-28%",
    opacity: 1,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: SlideDirection) => ({
    x: dir === "forward" ? "-28%" : "100%",
    opacity: 1,
  }),
};

export function DemoPhoneSlide({
  children,
  direction,
  screenKey,
}: {
  children: ReactNode;
  direction: SlideDirection;
  screenKey: string;
}) {
  return (
    <motion.div
      key={screenKey}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={SLIDE_SPRING}
      className="absolute inset-0 min-h-0 overflow-x-hidden overflow-y-auto px-3 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </motion.div>
  );
}

/** Tap / press feedback on demo buttons */
export function DemoTapButton({
  children,
  pressed = false,
  className = "",
}: {
  children: ReactNode;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <motion.span
      animate={{ scale: pressed ? 0.94 : 1 }}
      transition={{ duration: 0.12 }}
      className={`inline-block w-full ${className}`}
    >
      {children}
    </motion.span>
  );
}
