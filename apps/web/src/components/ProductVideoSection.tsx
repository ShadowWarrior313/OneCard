"use client";

import { motion } from "framer-motion";
import { ArrowRight, Link2, Smartphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { OneCardDemoFilm } from "./OneCardDemoFilm";

const STEPS = [
  {
    n: 1,
    icon: Link2,
    title: "Link your cards in minutes",
    body: "Add the Amex and Big Six cards you already carry to your OneCard wallet.",
  },
  {
    n: 2,
    icon: Smartphone,
    title: "Tap once at checkout",
    body: "Pay with a single OneCard — we read the merchant and pick the best underlying card.",
  },
  {
    n: 3,
    icon: Sparkles,
    title: "Keep every reward",
    body: "Points and cashback still post on your existing accounts. You just earn more.",
  },
];

export function ProductVideoSection() {
  return (
    <section id="see-onecard" className="scroll-mt-20 bg-[#f2f5f7] py-12 sm:py-16">
      <div className="oc-container">
        <h2 className="text-center text-2xl font-extrabold uppercase tracking-tight text-brand-ink sm:text-3xl">
          Pay smarter in three steps
        </h2>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl shadow-lift ring-1 ring-slate-200/80 sm:rounded-3xl">
              <OneCardDemoFilm />
            </div>
            <p className="mt-3 text-center text-xs text-brand-muted">
              Live product animation · OneCard only
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="space-y-8"
          >
            <ul className="space-y-6">
              {STEPS.map(({ n, icon: StepIcon, title, body }) => (
                <li key={n} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-ink text-sm font-bold text-white">
                    <StepIcon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold text-brand-ink">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/#waitlist" className="oc-btn-primary inline-flex w-full justify-center sm:w-auto">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              Get your OneCard
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
