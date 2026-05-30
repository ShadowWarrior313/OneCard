"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";

const FAQ_ITEMS = [
  {
    question: "Where can I use my OneCard?",
    answer:
      "Anywhere you can tap or insert a credit card — grocery stores, restaurants, online checkout, and more. OneCard works wherever your linked cards would, because the charge routes to one of them behind the scenes.",
  },
  {
    question: "Do I need my phone every time I pay?",
    answer:
      "No. Once your wallet is set up, you pay with your OneCard like any physical card. Your phone is only needed for setup, managing your wallet, and optional notifications — not at every checkout.",
  },
  {
    question: "How does OneCard pick which card to use?",
    answer:
      "We match the merchant category (like dining, groceries, or travel) and run it against the earn rates and bonus caps on the cards in your wallet. The card that returns the most on that specific purchase is selected automatically.",
  },
  {
    question: "Will I still earn rewards on my existing cards?",
    answer:
      "Yes. Points, cashback, and statement credits still post to the accounts you already have. OneCard does not replace your cards — it routes each charge to the one that earns the most for that purchase.",
  },
  {
    question: "What happens if I lose my OneCard?",
    answer:
      "Freeze or replace your OneCard from the app, the same way you would with any card issuer. Your linked cards are not affected — only the OneCard itself needs to be replaced.",
  },
  {
    question: "Is my card information stored on your servers?",
    answer:
      "We use tokenized routing — your full card numbers are not stored on our servers. Linked cards are represented by secure tokens from our payment partners, so charges can be routed without us holding sensitive card data.",
  },
  {
    question: "Can I use OneCard for business purchases?",
    answer:
      "Yes. You can designate a business card in your wallet. When you mark a purchase as business, OneCard routes it to that card only — personal reward cards stay out of the mix.",
  },
  {
    question: "Does OneCard work outside Canada?",
    answer:
      "OneCard is built for Canadian cardholders first. Support for U.S. cards and cross-border routing is on our roadmap — join the waitlist to hear when it launches in your region.",
  },
] as const;

export function HowItWorksFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="min-w-0 max-w-full rounded-[1.25rem] border border-zinc-200/80 bg-brand-surface p-5 sm:rounded-[1.5rem] sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-brand-ink sm:text-2xl">
        Questions, answered.
      </h2>

      <ul className="mt-5 divide-y divide-zinc-300/70 sm:mt-6">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <li key={item.question} className="min-w-0">
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                className="flex w-full min-w-0 items-start justify-between gap-3 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:gap-4 sm:py-5"
              >
                <span className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-brand-ink sm:text-base">
                  {item.question}
                </span>
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                    isOpen
                      ? "border-zinc-300 bg-white text-brand-ink"
                      : "border-transparent bg-white/80 text-brand-muted"
                  }`}
                  aria-hidden
                >
                  {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-sm leading-relaxed text-brand-body sm:pb-5">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
