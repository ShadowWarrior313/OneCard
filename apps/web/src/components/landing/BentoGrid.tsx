"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpRight,
  Layers,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { CARD_COUNT } from "@/data/cards";
import { PosTapAnimation } from "@/components/PosTapAnimation";

const reveal = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function BentoGrid() {
  return (
    <section className="relative -mt-8 bg-brand-cream pb-8 pt-4 sm:pb-12">
      <div className="absolute inset-0 bg-mesh-light" />
      <div className="oc-container-wide relative">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 max-w-2xl"
        >
          <p className="oc-eyebrow">How it works</p>
          <h2 className="oc-heading mt-3">One tap. Smarter every time.</h2>
        </motion.header>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
          <motion.div
            custom={0}
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="oc-bento lg:col-span-2 lg:row-span-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-brand-ink">Live routing</p>
                <p className="mt-1 max-w-sm text-sm text-brand-muted">
                  Watch OneCard scan your wallet and pick the winner at checkout.
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
                <Zap className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-6 flex justify-center rounded-2xl bg-brand-surface p-4 sm:p-6">
              <PosTapAnimation />
            </div>
            <Link
              href="/#simulator"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:text-brand-purple"
            >
              Try the simulator
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            custom={1}
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="oc-bento-dark text-white"
          >
            <Layers className="h-5 w-5 text-brand-ocean" />
            <p className="mt-4 text-5xl font-semibold tracking-tight">{CARD_COUNT}+</p>
            <p className="mt-2 text-lg font-medium text-zinc-300">Cards in your wallet</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Link every reward card you already own.
            </p>
            <Link
              href="/wallet"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-ocean hover:text-white"
            >
              Build your wallet
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            custom={2}
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          className="oc-bento bg-white/80 backdrop-blur-sm"
          >
            <TrendingUp className="h-5 w-5 text-brand-mint" />
            <p className="mt-4 text-3xl font-semibold tracking-tight text-brand-ink">
              +$6.45
            </p>
            <p className="mt-1 text-sm text-brand-muted">Extra on a typical dinner</p>
          </motion.div>

          <motion.div
            custom={3}
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="oc-bento lg:col-span-2"
          >
            <div className="flex flex-wrap items-start gap-6 sm:flex-nowrap">
              <div className="min-w-[140px] flex-1">
                <Sparkles className="h-5 w-5 text-brand-purple" />
                <p className="mt-3 font-semibold text-brand-ink">Instant MCC routing</p>
                <p className="mt-2 text-sm text-brand-muted">
                  Merchant category matched at tap — no app at checkout.
                </p>
              </div>
              <div className="hidden h-16 w-px bg-zinc-200 sm:block" />
              <div className="min-w-[180px] flex-1">
                <Shield className="h-5 w-5 text-brand-ink" />
                <p className="mt-3 font-semibold text-brand-ink">Your cards stay yours</p>
                <p className="mt-2 text-sm text-brand-muted">
                  Rewards post to your existing accounts. We only route the charge.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            custom={4}
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="oc-bento-dark flex flex-col justify-center text-center text-white"
          >
            <p className="text-2xl font-semibold tracking-tight">Tap once</p>
            <p className="mt-2 text-sm text-zinc-400">Earn on every category</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
