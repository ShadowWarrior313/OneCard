"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { PinwheelWalletVisual } from "@/components/landing/PinwheelWalletVisual";
import { useWallet } from "@/context/WalletContext";
import { getCardById } from "@/data/cards";

const EASE = [0.22, 1, 0.36, 1] as const;

const DEMO_CARD_IDS = [
  "amex_cobalt",
  "cibc_dividend_infinite",
  "scotia_momentum",
  "bmo_eclipse",
  "rbc_ion",
  "td_cashback",
  "amex_gold",
];

const CHECKLIST = [
  "Link Amex, Visa, and Big Six cards you already carry",
  "One physical OneCard routes every purchase",
  "Issuer rewards still post on your accounts",
  "Add or remove cards anytime in your wallet",
];

function issuerSummary(cards: ReturnType<typeof useWallet>["cards"]): string {
  const issuers = [...new Set(cards.map((c) => c.issuer.split(/\s+/)[0] ?? c.issuer))];
  if (issuers.length === 0) return "Amex · CIBC · RBC · BMO · TD · Scotiabank";
  if (issuers.length <= 4) return issuers.join(" · ");
  return `${issuers.slice(0, 4).join(" · ")} · +${issuers.length - 4}`;
}

export function WalletLinkExpandModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { cards } = useWallet();

  const pinwheelCards = useMemo(() => {
    if (cards.length > 0) return cards;
    return DEMO_CARD_IDS.map((id) => getCardById(id)).filter((c): c is NonNullable<typeof c> =>
      Boolean(c),
    );
  }, [cards]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-link-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-brand-ink/55 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close"
          />

          <motion.div
            className="relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-brand-ink hover:bg-violet-100 sm:right-5 sm:top-5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto">
              <div className="grid gap-6 border-b border-zinc-100 px-5 py-6 sm:grid-cols-[1fr_minmax(0,16rem)] sm:px-8 sm:py-8">
                <div className="min-w-0 pr-10 sm:pr-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Your wallet
                  </p>
                  <h2
                    id="wallet-link-modal-title"
                    className="mt-2 text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl"
                  >
                    Link the cards you already carry
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-muted">
                    Every card in your wallet stays linked behind OneCard. At checkout we pick the
                    best earn rate — you keep the rewards on each issuer account.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/wallet"
                      onClick={onClose}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#635bff] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5851e6]"
                    >
                      Open wallet
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/get-started"
                      onClick={onClose}
                      className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-zinc-50"
                    >
                      Get started
                    </Link>
                  </div>
                </div>
                <ul className="space-y-2.5 text-sm text-brand-body">
                  {CHECKLIST.map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" strokeWidth={2.5} />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[1.1fr_0.9fr] sm:gap-6 sm:p-6">
                <div className="overflow-visible rounded-2xl bg-gradient-to-br from-zinc-100 via-violet-50/80 to-sky-50 ring-1 ring-violet-100/80">
                  <PinwheelWalletVisual />
                </div>

                <div className="flex flex-col justify-center gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-white to-orange-100/50 px-5 py-6 ring-1 ring-orange-100/80">
                    <p className="text-3xl font-bold tracking-tight text-orange-500">
                      {cards.length > 0 ? cards.length : pinwheelCards.length}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-body">
                      {cards.length > 0 ? "cards in your wallet" : "cards shown in demo mode"}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-brand-muted">
                      {issuerSummary(cards.length > 0 ? cards : pinwheelCards)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/90 sm:p-5">
                    <p className="text-sm font-semibold text-brand-ink">How linking works</p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                      Your linked cards sit behind OneCard — faded in the ring because you never
                      pick at checkout. OneCard at the top is the only card you tap; routing
                      happens in the background.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
