"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { CARD_COUNT } from "@/data/cards";
import { HeroCardStack } from "./HeroCardStack";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-brand-obsidian pt-28 pb-16 sm:pt-32">
      <div className="absolute inset-0 bg-mesh-dark" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="oc-container-wide relative grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
        <div className="text-center lg:text-left">
          <motion.p
            custom={0}
            variants={fade}
            initial="hidden"
            animate="show"
            className="oc-eyebrow-dark text-brand-ocean"
          >
            Canada · Every card you carry
          </motion.p>

          <motion.h1
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="oc-display-dark mt-5"
          >
            Your entire wallet.{" "}
            <span className="oc-gradient-text">One card.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="oc-lead-dark mx-auto max-w-md lg:mx-0"
          >
            Tap once. We route every purchase to the card that earns the most —
            automatically.
          </motion.p>

          <motion.div
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <Link href="/#waitlist" className="oc-btn-primary-dark">
              Get OneCard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/wallet" className="oc-btn-secondary">
              <Wallet className="h-4 w-4" />
              Open wallet
            </Link>
          </motion.div>

          <motion.p
            custom={4}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 backdrop-blur-sm"
          >
            <span className="h-2 w-2 rounded-full bg-brand-mint shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>
              <strong className="font-semibold text-white">{CARD_COUNT}+</strong>{" "}
              reward cards supported
            </span>
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative lg:pl-4"
        >
          <HeroCardStack />
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-cream to-transparent" />
    </section>
  );
}
