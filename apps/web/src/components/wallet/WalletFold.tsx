"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  WALLET_PEEK,
  WALLET_SLIDE_UP,
  WALLET_SPRING,
  walletSlideHeadroom,
} from "@/lib/walletFoldMotion";
import { WalletCardVisual } from "./WalletCardVisual";
import { WalletCardPopover } from "./WalletCardPopover";
import { topMerchantsForCard } from "@/lib/recommendations";

export function WalletFold() {
  const { cards, businessCardId } = useWallet();
  const [activeId, setActiveId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setActiveId(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const active = cards.find((c) => c.cardId === activeId);
  const activeIndex = active ? cards.findIndex((c) => c.cardId === activeId) : -1;
  const headroom = walletSlideHeadroom(activeIndex);

  useEffect(() => {
    if (!cards.length || !activeId || activeIndex > 2) return;
    const scrollEl = ref.current?.closest("main");
    if (!scrollEl || !ref.current) return;
    const walletTop = ref.current.getBoundingClientRect().top;
    const mainTop = scrollEl.getBoundingClientRect().top;
    if (walletTop - mainTop < WALLET_SLIDE_UP) {
      scrollEl.scrollBy({ top: walletTop - mainTop - WALLET_SLIDE_UP - 8, behavior: "smooth" });
    }
  }, [activeId, activeIndex, cards.length]);

  if (!cards.length) {
    return (
      <div className="mx-auto flex max-w-[22rem] min-h-[14rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-[#eef0f3] px-6 py-12 text-center">
        <p className="text-sm font-semibold text-brand-ink">Your wallet is empty</p>
        <p className="mt-1 text-xs text-brand-muted">Add cards in the panel →</p>
      </div>
    );
  }

  const stackH = cards.length > 0 ? WALLET_PEEK + (cards.length - 1) * WALLET_PEEK : WALLET_PEEK;
  const recs = active ? topMerchantsForCard(active.cardId, cards, 3) : [];

  return (
    <div
      ref={ref}
      className={`relative mx-auto w-full max-w-[22rem] overflow-visible ${active ? "pb-4" : ""}`}
    >
      <motion.div
        aria-hidden
        className="shrink-0"
        initial={false}
        animate={{ height: headroom }}
        transition={WALLET_SPRING}
      />

      <div className="overflow-visible rounded-3xl bg-[#eef0f3] shadow-card ring-1 ring-slate-200/80">
        {/* Pocket lip */}
        <div className="relative overflow-hidden rounded-t-3xl border-b border-slate-200/90 bg-[#e2e5e9] px-4 pb-3 pt-4">
          <svg
            className="absolute left-1/2 top-0 h-4 w-24 -translate-x-1/2 text-[#eef0f3]"
            viewBox="0 0 96 16"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M0 0h96v8c-24 16-72 16-96 0V0z"
            />
          </svg>
          <p className="relative text-center text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
            OneCard wallet
          </p>
        </div>

        <div
          className="relative overflow-visible rounded-b-3xl px-3 pb-4"
          style={{
            paddingTop: active ? WALLET_SLIDE_UP + 16 : 12,
            minHeight: stackH + (active ? 240 : 32),
          }}
        >
          {cards.map((card, i) => {
            const isActive = activeId === card.cardId;
            const isBehindActive = activeIndex >= 0 && i < activeIndex;

            return (
              <motion.button
                key={card.cardId}
                type="button"
                className="absolute left-3 right-3 block origin-top text-left"
                style={{
                  top: i * WALLET_PEEK,
                  zIndex: isActive ? 40 : i + 1,
                }}
                onClick={() => setActiveId(isActive ? null : card.cardId)}
                animate={{
                  y: isActive ? -WALLET_SLIDE_UP : isBehindActive ? -4 : 0,
                  scale: 1,
                }}
                transition={WALLET_SPRING}
                aria-expanded={isActive}
                aria-label={`${card.displayName}${businessCardId === card.cardId ? ", business card" : ""}`}
              >
                {isActive ? (
                  <WalletCardVisual
                    card={card}
                    active
                    isBusiness={businessCardId === card.cardId}
                  />
                ) : (
                  <WalletCardVisual
                    card={card}
                    peek
                    isBusiness={businessCardId === card.cardId}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            key={active.cardId}
            className="relative z-50 mt-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
          >
            <WalletCardPopover card={active} recs={recs} />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-3 text-center text-xs text-brand-muted">
        Tap a card to slide it out · set your business card below
      </p>
    </div>
  );
}
