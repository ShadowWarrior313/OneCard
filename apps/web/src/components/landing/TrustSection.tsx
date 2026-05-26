"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck, Wallet } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    body: "Tokenized routing — your full card numbers never touch our servers.",
  },
  {
    icon: Lock,
    title: "PCI by design",
    body: "Built for tokenized PAN flows from day one, not bolted on later.",
  },
  {
    icon: Wallet,
    title: "You keep your rewards",
    body: "Points and cashback post to the same accounts you use today.",
  },
];

export function TrustSection() {
  return (
    <section className="relative overflow-hidden bg-brand-obsidian py-20 sm:py-28">
      <div className="absolute inset-0 bg-mesh-dark opacity-80" />
      <div className="oc-container-wide relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="oc-eyebrow-dark">Trust</p>
          <h2 className="oc-display-dark mt-4 text-3xl sm:text-4xl lg:text-5xl">
            Built like a real fintech.
          </h2>
          <p className="oc-lead-dark mx-auto mt-4 max-w-lg">
            Calm, secure, and designed for the long term — not a weekend hackathon.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }, i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="oc-glass p-6 text-center sm:p-8"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-brand-ocean">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
