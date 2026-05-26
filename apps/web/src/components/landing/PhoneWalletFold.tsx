"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CardProduct } from "@onecard/shared-types";
import { Briefcase, Check, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IssuerLogo } from "@/components/IssuerLogo";
import { WalletCardVisual } from "@/components/wallet/WalletCardVisual";
import { CARD_CATALOG } from "@/data/cards";

import {
  WALLET_PEEK,
  WALLET_SLIDE_UP,
  WALLET_SPRING,
  walletSlideHeadroom,
} from "@/lib/walletFoldMotion";

function shortCardName(name: string): string {
  return name.replace(/American Express/g, "Amex").replace(/ Card$/, "");
}

export function PhoneWalletFold({
  cards,
  defaultCardId,
  businessCardId,
  hasCard,
  onSetDefault,
  onSetBusiness,
  onToggleCard,
}: {
  cards: CardProduct[];
  defaultCardId: string | undefined;
  businessCardId: string | undefined;
  hasCard: (id: string) => boolean;
  onSetDefault: (id: string) => void;
  onSetBusiness: (id: string | undefined) => void;
  onToggleCard: (id: string) => void;
}) {
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
  const stackH =
    cards.length > 0 ? WALLET_PEEK + (cards.length - 1) * WALLET_PEEK : WALLET_PEEK;
  const addable = CARD_CATALOG.filter((c) => !hasCard(c.cardId)).slice(0, 10);
  const headroom = walletSlideHeadroom(activeIndex);

  useEffect(() => {
    if (!activeId || activeIndex > 2) return;
    const scrollEl = ref.current?.closest("[data-phone-scroll]");
    scrollEl?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeId, activeIndex]);

  if (cards.length === 0) {
    return (
      <div ref={ref} className="pb-4">
        <div className="phone-leather-wallet flex min-h-[10rem] flex-col items-center justify-center rounded-2xl px-4 py-8 text-center">
          <p className="text-sm font-semibold text-amber-100/90">Wallet is empty</p>
          <p className="mt-1 text-xs text-amber-100/60">Add cards below</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="mx-auto min-w-0 max-w-full pb-6">
      {/* Scroll headroom — top cards (e.g. CIBC) need space to slide up like TD */}
      <motion.div
        aria-hidden
        className="shrink-0"
        initial={false}
        animate={{ height: headroom }}
        transition={WALLET_SPRING}
      />

      <div className={`relative w-full ${active ? "pb-1" : ""}`}>
        <div className="phone-leather-wallet overflow-visible rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
          <div className="phone-leather-lip relative overflow-hidden rounded-t-2xl px-3 pb-2.5 pt-3">
            <svg
              className="absolute left-1/2 top-0 h-3.5 w-16 -translate-x-1/2 text-[#3d2819]"
              viewBox="0 0 96 16"
              aria-hidden
            >
              <path fill="currentColor" d="M0 0h96v8c-24 16-72 16-96 0V0z" />
            </svg>
            <p className="relative text-center text-[0.55rem] font-bold uppercase tracking-[0.2em] text-amber-200/70">
              OneCard wallet
            </p>
          </div>

          <div
            className="relative overflow-visible rounded-b-2xl px-2 pb-4"
            style={{
              paddingTop: active ? WALLET_SLIDE_UP + 16 : 12,
              minHeight: stackH + (active ? 240 : 32),
            }}
          >
            {cards.map((card, i) => {
              const isActive = activeId === card.cardId;
              const isBehindActive = activeIndex >= 0 && i < activeIndex;
              const isDefault = card.cardId === defaultCardId;
              const isBusiness = card.cardId === businessCardId;

              return (
                <motion.button
                  key={card.cardId}
                  type="button"
                  className="absolute left-2 right-2 block origin-top text-left"
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
                  aria-label={`${card.displayName}${isBusiness ? ", business card" : ""}`}
                >
                  {isActive ? (
                    <WalletCardVisual card={card} active isBusiness={isBusiness} />
                  ) : (
                    <WalletCardVisual card={card} peek isBusiness={isBusiness} />
                  )}
                  {!isActive && isDefault && (
                    <span className="pointer-events-none absolute right-2 top-1.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-amber-300/90 text-[#3d2819] shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-current" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            key={active.cardId}
            className="relative z-50 mt-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
          >
            <PhoneWalletCardActions
              card={active}
              isDefault={active.cardId === defaultCardId}
              isBusiness={active.cardId === businessCardId}
              onSetDefault={() => onSetDefault(active.cardId)}
              onSetBusiness={() =>
                onSetBusiness(active.cardId === businessCardId ? undefined : active.cardId)
              }
              onClose={() => setActiveId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!active && (
        <p className="mt-2 text-center text-[0.65rem] text-brand-muted">
          Tap a card to slide it out · tap again to tuck back
        </p>
      )}

      {addable.length > 0 && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
            Add cards
          </p>
          <ul className="mt-2 space-y-0.5">
            {addable.map((card) => (
              <li key={card.cardId}>
                <button
                  type="button"
                  onClick={() => onToggleCard(card.cardId)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-1.5 py-2 text-left transition hover:bg-[#f6f5f2]"
                >
                  <IssuerLogo issuer={card.issuer} cardId={card.cardId} size={26} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-brand-ink">
                    {shortCardName(card.displayName)}
                  </span>
                  <span className="text-xs font-semibold text-brand-ink">Add</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PhoneWalletCardActions({
  card,
  isDefault,
  isBusiness,
  onSetDefault,
  onSetBusiness,
  onClose,
}: {
  card: CardProduct;
  isDefault: boolean;
  isBusiness: boolean;
  onSetDefault: () => void;
  onSetBusiness: () => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-ink">{card.displayName}</p>
          <p className="text-xs text-brand-muted">{card.issuer}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand-muted hover:bg-zinc-100 hover:text-brand-ink"
        >
          Done
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onSetDefault}
          disabled={isDefault}
          className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[0.65rem] font-semibold transition ${
            isDefault
              ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
              : "bg-[#f6f5f2] text-brand-ink hover:bg-zinc-100"
          }`}
        >
          {isDefault ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Default
            </>
          ) : (
            <>
              <Star className="h-3.5 w-3.5" />
              Set default
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onSetBusiness}
          className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[0.65rem] font-semibold transition ${
            isBusiness
              ? "bg-brand-ink text-white"
              : "border border-zinc-200 bg-white text-brand-ink hover:bg-[#f6f5f2]"
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          {isBusiness ? "Business ✓" : "Business"}
        </button>
      </div>
    </div>
  );
}
