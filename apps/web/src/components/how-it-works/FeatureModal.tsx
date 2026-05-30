"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { FeatureCardConfig, FeatureId } from "@/components/how-it-works/demoData";
import { MockupFrame } from "@/components/how-it-works/MockupFrame";
import { RoutingDeepDive } from "@/components/how-it-works/RoutingDeepDive";
import { SpendScene } from "@/components/how-it-works/scenes/SpendScene";
import { BillsScene } from "@/components/how-it-works/scenes/BillsScene";
import { WalletStackScene, TokenScene } from "@/components/how-it-works/scenes/WalletStackScene";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";
import { DEMO_EASE } from "@/components/how-it-works/demoMotion";

function ModalMockup({ id }: { id: FeatureId }) {
  const reducedMotion = usePrefersReducedMotion();

  if (id === "routing") {
    return (
      <div className="min-h-[20rem] w-full rounded-2xl bg-gradient-to-b from-sky-50/80 to-white p-1 md:min-h-[24rem]">
        <RoutingDeepDive />
      </div>
    );
  }

  return (
    <MockupFrame
      density="modal"
      aspectRatio="auto"
      className="min-h-[18rem] w-full rounded-2xl bg-brand-surface/50 md:min-h-[22rem]"
    >
      {id === "wallet" && (
        <WalletStackScene reducedMotion={reducedMotion} density="modal" />
      )}
      {id === "spend" && (
        <SpendScene progress={0.82} density="modal" reducedMotion={reducedMotion} />
      )}
      {id === "bills" && (
        <BillsScene progress={0.78} density="modal" reducedMotion={reducedMotion} />
      )}
      {id === "tokenized" && (
        <TokenScene reducedMotion={reducedMotion} density="modal" />
      )}
    </MockupFrame>
  );
}

const DEEPER_COPY: Record<FeatureId, string> = {
  routing:
    "Every merchant has a category code (MCC). OneCard reads it in milliseconds, scores every linked card by earn rate × category multiplier × bonus caps, and charges the winner — without you lifting a finger.",
  wallet:
    "Link your existing Visa, Mastercard, and Amex cards once. OneCard sits in your wallet as the single physical card you tap everywhere — your issuer apps, rewards balances, and account numbers stay exactly as they are.",
  spend:
    "Rewards post on whichever real account earned them — your Amex Cobalt points land in Membership Rewards, your Visa cashback hits your statement. OneCard just shows you a unified view of where each dollar went.",
  bills:
    "Recurring charges (Netflix, phone, insurance) get routed to the card with the best ongoing earn rate for that billing category — automatically, every cycle, without touching your autopay settings.",
  tokenized:
    "OneCard never stores full card numbers. Each linked account is represented by a secure payment token. Charges route through the token; the issuer settles the real card. Your data never touches our servers.",
};

export function FeatureModal({
  feature,
  onClose,
}: {
  feature: FeatureCardConfig | null;
  onClose: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!feature) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !closeRef.current) return;
      const dialog = closeRef.current.closest('[role="dialog"]');
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [feature, onClose]);

  return (
    <AnimatePresence>
      {feature && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
        >
          <button
            type="button"
            aria-label="Close dialog backdrop"
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-modal-title"
            className="relative z-10 flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl sm:rounded-[1.5rem]"
            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: DEMO_EASE }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
              <h2
                id="feature-modal-title"
                className="text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl"
              >
                {feature.headline}
              </h2>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-brand-muted transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {/* Two-column text summary */}
              <div className="grid gap-5 md:grid-cols-2 md:gap-8">
                <div>
                  <p className="text-sm leading-relaxed text-brand-body">{feature.subcopy}</p>
                  <p className="mt-3 text-sm leading-relaxed text-brand-body">
                    {DEEPER_COPY[feature.id]}
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-brand-body">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        strokeWidth={2.5}
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Deep-dive mockup */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-100 bg-brand-surface/50">
                <ModalMockup id={feature.id} />
              </div>

              {/* CTAs */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  Join the waitlist
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/simulator"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-brand-ink hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  Try the simulator
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FeatureBentoShell({ children }: { children: ReactNode }) {
  return (
    <section className="border-b border-zinc-200 bg-white py-12 sm:py-16">
      <div className="oc-container-wide mx-auto min-w-0 max-w-6xl">
        <p className="oc-eyebrow">What happens in one tap</p>
        <h2 className="oc-heading mt-3 text-2xl sm:text-3xl">Built for real wallets, real rewards</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">
          Tap once at checkout. OneCard reads the merchant, routes to your best card, and keeps
          rewards on the accounts you already use.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
      </div>
    </section>
  );
}
