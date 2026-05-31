"use client";

import { useEffect, useMemo } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { getCardAppearance } from "@/data/cardAppearances";
import { getCardById } from "@/data/cards";
import { cardBackgroundStyle } from "@/lib/cardBackground";
import {
  formatAnnualFee,
  formatCashAdvanceRate,
  formatPurchaseRate,
  formatSecondCardFee,
  offerKey,
} from "@/lib/cardFinderDisplay";
import { matchFinderOfferToCardId } from "@/lib/cardFinderMatch";
import type { FinderOffer } from "@/types/cardFinder";

const MAX_COMPARE_CARDS = 4;

function cardIdForOffer(offer: FinderOffer): string | undefined {
  return offer.cardId ?? matchFinderOfferToCardId(offer.title, offer.providerName);
}

function ComparisonCardHeader({
  offer,
  onRemove,
}: {
  offer: FinderOffer;
  onRemove: () => void;
}) {
  const cardId = cardIdForOffer(offer);
  const card = cardId ? getCardById(cardId) : undefined;
  const appearance = card ? getCardAppearance(card.cardId, card.issuer) : undefined;

  return (
    <div className="relative flex min-h-[13rem] flex-col rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-brand-ink"
        aria-label={`Remove ${offer.title} from comparison`}
      >
        <X className="h-4 w-4" />
      </button>
      <div
        className="mt-6 aspect-[1.586] w-full rounded-lg shadow-sm ring-1 ring-black/10"
        style={appearance ? cardBackgroundStyle(appearance) : undefined}
      >
        {!appearance && <div className="h-full rounded-lg bg-gradient-to-br from-zinc-300 to-zinc-400" />}
      </div>
      <p className="mt-3 text-xs font-semibold leading-snug text-brand-ink">{offer.title}</p>
      <p className="mt-1 text-[0.68rem] text-brand-muted">{offer.providerName}</p>
    </div>
  );
}

function EmptyComparisonSlot({
  offers,
  onAdd,
}: {
  offers: FinderOffer[];
  onAdd: (key: string) => void;
}) {
  return (
    <div className="flex min-h-[13rem] flex-col justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-3">
      <Plus className="mx-auto h-5 w-5 text-sky-600" />
      <p className="mt-2 text-center text-xs font-semibold text-brand-ink">Add another card</p>
      <select
        value=""
        onChange={(event) => {
          if (event.target.value) onAdd(event.target.value);
        }}
        className="mt-3 min-h-[40px] w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-brand-ink"
        aria-label="Add another card to comparison"
      >
        <option value="">Choose a card</option>
        {offers.map((offer) => (
          <option key={offerKey(offer)} value={offerKey(offer)}>
            {offer.title}
          </option>
        ))}
      </select>
    </div>
  );
}

function ComparisonValue({ value }: { value: string }) {
  return <div className="rounded-xl bg-white px-3 py-3 text-xs font-semibold text-brand-ink">{value}</div>;
}

export function CardFinderCompareModal({
  offers,
  selectedKeys,
  onToggle,
  onClose,
}: {
  offers: FinderOffer[];
  selectedKeys: Set<string>;
  onToggle: (key: string, checked: boolean) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const selectedOffers = useMemo(
    () => offers.filter((offer) => selectedKeys.has(offerKey(offer))).slice(0, MAX_COMPARE_CARDS),
    [offers, selectedKeys],
  );
  const addableOffers = useMemo(
    () => offers.filter((offer) => !selectedKeys.has(offerKey(offer))),
    [offers, selectedKeys],
  );
  const slots = Array.from({ length: MAX_COMPARE_CARDS - selectedOffers.length });
  const rows = [
    {
      label: "Annual fee",
      value: (offer: FinderOffer) => formatAnnualFee(offer.details, cardIdForOffer(offer)),
    },
    {
      label: "Purchase rate",
      value: (offer: FinderOffer) => formatPurchaseRate(offer, cardIdForOffer(offer)),
    },
    {
      label: "Cash advance rate",
      value: (offer: FinderOffer) => formatCashAdvanceRate(offer, cardIdForOffer(offer)),
    },
    {
      label: "Second card",
      value: (offer: FinderOffer) => formatSecondCardFee(offer.details, cardIdForOffer(offer)),
    },
    {
      label: "Welcome offer",
      value: (offer: FinderOffer) => offer.details.welcomeBonus ?? "No offer listed",
    },
    {
      label: "Rewards",
      value: (offer: FinderOffer) => offer.details.rewardsRate ?? "See issuer details",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-comparison-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className="flex h-[calc(100dvh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-[#f4f5f3] shadow-2xl sm:h-[calc(100dvh-2.5rem)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-700">OneCard compare</p>
            <h2 id="card-comparison-title" className="mt-1 text-2xl font-semibold tracking-tight text-brand-ink">
              Compare cards side by side
            </h2>
            <p className="mt-1 text-sm text-brand-muted">Add up to three more cards to compare the details that matter.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-brand-ink"
            aria-label="Close card comparison"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-7">
          <div className="min-w-[58rem]">
            <div className="grid grid-cols-[11rem_repeat(4,minmax(0,1fr))] gap-3">
              <div className="flex items-end pb-3">
                <p className="text-lg font-semibold tracking-tight text-brand-ink">Your comparison</p>
              </div>
              {selectedOffers.map((offer) => (
                <ComparisonCardHeader
                  key={offerKey(offer)}
                  offer={offer}
                  onRemove={() => onToggle(offerKey(offer), false)}
                />
              ))}
              {slots.map((_, index) => (
                <EmptyComparisonSlot
                  key={`empty-${index}`}
                  offers={addableOffers}
                  onAdd={(key) => onToggle(key, true)}
                />
              ))}

              {rows.map((row) => (
                <div key={row.label} className="contents">
                  <div className="flex items-center border-t border-zinc-200 px-1 py-3 text-sm font-medium text-brand-ink">
                    {row.label}
                  </div>
                  {selectedOffers.map((offer) => (
                    <ComparisonValue key={`${row.label}-${offerKey(offer)}`} value={row.value(offer)} />
                  ))}
                  {slots.map((_, index) => (
                    <ComparisonValue key={`${row.label}-empty-${index}`} value="—" />
                  ))}
                </div>
              ))}

              <div />
              {selectedOffers.map((offer) => (
                <a
                  key={`view-${offerKey(offer)}`}
                  href={offer.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[42px] items-center justify-center gap-1 rounded-xl bg-brand-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-charcoal"
                >
                  View card
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
              {slots.map((_, index) => (
                <div key={`view-empty-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
