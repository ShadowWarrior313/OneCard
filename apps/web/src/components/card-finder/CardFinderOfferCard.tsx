"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { FinderOffer } from "@/types/cardFinder";
import { getCardById } from "@/data/cards";
import { getCardAppearance } from "@/data/cardAppearances";
import { useCardImage } from "@/hooks/useCardImage";
import { cardBackgroundStyle } from "@/lib/cardBackground";
import {
  formatAnnualFee,
  formatCashAdvanceRate,
  formatPurchaseRate,
  formatSecondCardFee,
  hasOfferBadge,
} from "@/lib/cardFinderDisplay";
import { matchFinderOfferToCardId } from "@/lib/cardFinderMatch";

function CardArtFallback({ cardId, title }: { cardId?: string; title: string }) {
  const card = cardId ? getCardById(cardId) : undefined;
  const appearance = card ? getCardAppearance(card.cardId, card.issuer) : null;

  if (card && appearance) {
    return (
      <div
        className="aspect-[1.586] w-[10.5rem] max-w-[88%] overflow-hidden rounded-lg shadow-md ring-1 ring-black/10"
        style={cardBackgroundStyle(appearance)}
        aria-hidden
      >
        <div className="flex h-full flex-col justify-between p-2.5 text-[0.45rem] font-bold uppercase tracking-wide text-white/90">
          <span>{card.issuer}</span>
          <span className="truncate text-[0.5rem]">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="aspect-[1.586] w-[10.5rem] max-w-[88%] rounded-lg bg-gradient-to-br from-zinc-300 to-zinc-400 shadow-md ring-1 ring-black/10"
      aria-hidden
    />
  );
}

function CardArtPhoto({ cardId, title }: { cardId: string; title: string }) {
  const { imageUrl } = useCardImage(cardId);
  const [imageFailed, setImageFailed] = useState(false);

  if (imageUrl && !imageFailed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={imageUrl}
        alt=""
        className="max-h-[7.5rem] w-auto max-w-[92%] object-contain drop-shadow-md"
        loading="lazy"
        decoding="async"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <CardArtFallback cardId={cardId} title={title} />;
}

function CardArt({ cardId, title }: { cardId?: string; title: string }) {
  if (cardId) return <CardArtPhoto cardId={cardId} title={title} />;
  return <CardArtFallback title={title} />;
}

function StatCell({ label, value, footnote }: { label: string; value: string; footnote?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.65rem] leading-snug text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-none text-zinc-900">
        {value}
        {footnote && value !== "—" ? (
          <span className="text-sky-600" aria-hidden>
            *
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function CardFinderOfferCard({
  offer,
  compared,
  onCompareChange,
}: {
  offer: FinderOffer;
  compared: boolean;
  onCompareChange: (checked: boolean) => void;
}) {
  const cardId = useMemo(
    () => offer.cardId ?? matchFinderOfferToCardId(offer.title, offer.providerName),
    [offer.cardId, offer.title, offer.providerName],
  );

  const annualFee = formatAnnualFee(offer.details, cardId);
  const purchaseRate = formatPurchaseRate(offer, cardId);
  const cashAdvanceRate = formatCashAdvanceRate(offer, cardId);
  const secondCard = formatSecondCardFee(offer.details, cardId);
  const showBadge = hasOfferBadge(offer);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="relative bg-[#f5f7f8] px-4 pb-5 pt-8">
        {showBadge && (
          <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5c400] px-3 py-1 text-[0.65rem] font-semibold leading-none text-zinc-900 shadow-sm">
            Offer Available
          </span>
        )}
        <div className="flex min-h-[8.5rem] items-center justify-center">
          <CardArt cardId={cardId} title={offer.title} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
          <h3 className="min-w-0 text-sm font-semibold leading-snug text-zinc-900">{offer.title}</h3>
          <div className="shrink-0 text-right">
            <p className="text-[0.65rem] text-zinc-500">Annual Fee</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900">{annualFee}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-b border-zinc-100 pb-3">
          <StatCell label="Purchase Rate" value={purchaseRate} />
          <StatCell label="Cash Advance Rate" value={cashAdvanceRate} footnote />
          <StatCell label="Second Card" value={secondCard} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={compared}
              onChange={(e) => onCompareChange(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
            />
            Compare
          </label>
          <a
            href={offer.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            View Card
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </article>
  );
}
