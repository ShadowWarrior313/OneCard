"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { OneCardDemoFilm } from "./OneCardDemoFilm";

const STEPS = [
  {
    n: "01",
    title: "Link your cards",
    body: "Add the reward cards you already carry to your OneCard wallet.",
  },
  {
    n: "02",
    title: "Tap once",
    body: "Pay with a single OneCard — we read the merchant and route automatically.",
  },
  {
    n: "03",
    title: "Earn more",
    body: "Points and cashback still post on your existing accounts.",
  },
];

export function ProductVideoSection() {
  return (
    <section id="see-onecard" className="scroll-mt-24 bg-brand-surface py-20 sm:py-28">
      <div className="oc-container-wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="oc-eyebrow">Product</p>
          <h2 className="oc-heading mt-3">See it in motion</h2>
        </motion.div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-ocean/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-brand-obsidian shadow-lift ring-1 ring-black/5">
              <OneCardDemoFilm />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="space-y-10"
          >
            <ol className="space-y-8">
              {STEPS.map(({ n, title, body }) => (
                <li key={n} className="flex gap-5">
                  <span className="text-sm font-semibold tabular-nums text-brand-ocean">
                    {n}
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-brand-ink">{title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal"
            >
              Get your OneCard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
