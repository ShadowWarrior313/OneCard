"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  CreditCard,
  Gift,
  ScanLine,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";

const EASE = [0.22, 1, 0.36, 1] as const;

const STAGES: { step: number; label: string; detail: string; icon: LucideIcon }[] = [
  {
    step: 1,
    label: "Tap OneCard at terminal",
    detail: "Same contactless tap you use today.",
    icon: CreditCard,
  },
  {
    step: 2,
    label: "Detect merchant category",
    detail: "MCC code maps to dining, gas, groceries, and more.",
    icon: ScanLine,
  },
  {
    step: 3,
    label: "Routing engine picks best card",
    detail: "Earn rates and bonus caps scored in milliseconds.",
    icon: Sparkles,
  },
  {
    step: 4,
    label: "Charge posts to that card",
    detail: "The purchase settles on your real Visa, Amex, or Mastercard account.",
    icon: Wallet,
  },
  {
    step: 5,
    label: "Rewards land as usual",
    detail: "Points or cashback post on the account you already use.",
    icon: Gift,
  },
];

function FlowArrow({ vertical }: { vertical: boolean }) {
  const Icon = vertical ? ArrowDown : ArrowRight;
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={`flex shrink-0 items-center justify-center text-sky-600 ${
        vertical ? "h-8 py-1" : "w-8 px-1 sm:w-10"
      }`}
      aria-hidden
    >
      <motion.div
        initial={{ opacity: 0.45 }}
        animate={
          reducedMotion
            ? { opacity: 0.75 }
            : { opacity: [0.45, 1, 0.45], x: vertical ? 0 : [0, 4, 0], y: vertical ? [0, 4, 0] : 0 }
        }
        transition={{ duration: 1.6, repeat: reducedMotion ? 0 : Infinity, ease: "easeInOut" }}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </motion.div>
    </div>
  );
}

function StageNode({
  stage,
  index,
}: {
  stage: (typeof STAGES)[number];
  index: number;
}) {
  const Icon = stage.icon;
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reducedMotion ? 0 : 0.45, delay: index * 0.08, ease: EASE }}
      className="relative flex min-w-0 flex-1 flex-col items-center text-center sm:max-w-[9.5rem]"
    >
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-ink text-white shadow-[0_1px_2px_rgba(11,11,15,0.08),0_12px_24px_-8px_rgba(11,11,15,0.2)] ring-4 ring-sky-100">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[0.65rem] font-bold text-white ring-2 ring-white">
          {stage.step}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-snug text-brand-ink">{stage.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-brand-muted">{stage.detail}</p>
    </motion.div>
  );
}

export function UnderTheHoodSteps() {
  return (
    <section className="border-b border-zinc-200 bg-brand-surface py-12 sm:py-16">
      <div className="oc-container-wide mx-auto min-w-0 max-w-5xl">
        <p className="oc-eyebrow">Under the hood</p>
        <h2 className="oc-heading mt-3 text-2xl sm:text-3xl">What happens in one tap</h2>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-brand-body">
          You tap once with OneCard. We read the merchant category, pick the best card in your
          wallet for that purchase, and route the charge through a secure token — your full card
          numbers never touch our servers. Rewards still post on whichever real account earned
          them.
        </p>

        <div className="relative mt-10 hidden sm:block">
          <div className="absolute left-[10%] right-[10%] top-7 h-0.5 bg-gradient-to-r from-transparent via-sky-200 to-transparent" aria-hidden />
          <ol className="relative flex items-start">
            {STAGES.map((stage, i) => (
              <li key={stage.step} className="flex min-w-0 flex-1 items-start">
                <StageNode stage={stage} index={i} />
                {i < STAGES.length - 1 && <FlowArrow vertical={false} />}
              </li>
            ))}
          </ol>
        </div>

        <ol className="mt-10 flex flex-col items-stretch sm:hidden">
          {STAGES.map((stage, i) => (
            <li key={stage.step} className="flex flex-col items-center">
              <StageNode stage={stage} index={i} />
              {i < STAGES.length - 1 && <FlowArrow vertical />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
