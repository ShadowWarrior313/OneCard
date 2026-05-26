"use client";

import { useState } from "react";
import type { CardProduct } from "@onecard/shared-types";
import { getCardAppearance, tierLabel } from "@/data/cardAppearances";
import { useCardImage } from "@/hooks/useCardImage";
import { cardBackgroundStyle, cardTextClass } from "@/lib/cardBackground";

function shortName(card: CardProduct): string {
  const parts = card.displayName.split(" ");
  return parts.length > 2 ? parts.slice(-2).join(" ") : card.displayName;
}

function EmvChip() {
  return (
    <span
      className="h-4 w-6 rounded-sm bg-gradient-to-br from-amber-200/90 via-amber-300/80 to-amber-500/70 shadow-inner ring-1 ring-black/20"
      aria-hidden
    />
  );
}

function NetworkMark({ network }: { network: "visa" | "mastercard" | "amex" }) {
  if (network === "visa") {
    return (
      <span className="text-[0.5rem] font-black italic tracking-tighter">
        VISA
      </span>
    );
  }
  if (network === "mastercard") {
    return (
      <span className="flex gap-0.5" aria-hidden>
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="-ml-1.5 h-3 w-3 rounded-full bg-amber-400" />
      </span>
    );
  }
  return (
    <span className="text-[0.45rem] font-bold uppercase tracking-wide">
      AMEX
    </span>
  );
}

function CardArtLayer({
  imageUrl,
  alt,
  onError,
}: {
  imageUrl: string;
  alt: string;
  onError: () => void;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
        onError={onError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
    </>
  );
}

export function WalletCardVisual({
  card,
  peek,
  active,
  isBusiness,
}: {
  card: CardProduct;
  peek?: boolean;
  active?: boolean;
  isBusiness?: boolean;
}) {
  const appearance = getCardAppearance(card.cardId, card.issuer);
  const tier = tierLabel(appearance.tier);
  const label = appearance.faceLabel ?? shortName(card);
  const bg = cardBackgroundStyle(appearance);
  const text = cardTextClass(appearance);
  const { imageUrl } = useCardImage(card.cardId);
  const [imageFailed, setImageFailed] = useState(false);
  const showArt = Boolean(imageUrl && !imageFailed);

  if (peek) {
    return (
      <div
        className={`relative flex h-11 w-full items-center justify-between overflow-hidden rounded-t-2xl px-3 pb-1.5 pt-2 shadow-md ring-1 ring-black/15 ${
          showArt ? "text-white" : text
        } ${active ? "shadow-lg ring-2 ring-brand-ink/25" : ""}`}
        style={showArt ? undefined : bg}
      >
        {showArt && imageUrl && (
          <CardArtLayer
            imageUrl={imageUrl}
            alt={card.displayName}
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="relative z-10 flex min-w-0 items-center gap-2">
          {!showArt && <EmvChip />}
          <span
            className={`truncate text-[0.55rem] font-bold uppercase tracking-wide ${
              showArt ? "drop-shadow-sm" : ""
            }`}
          >
            {label}
          </span>
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-1.5">
          {isBusiness && (
            <span className="rounded bg-black/35 px-1 text-[0.45rem] font-bold uppercase backdrop-blur-sm">
              Biz
            </span>
          )}
          {!showArt && <NetworkMark network={appearance.network} />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-xl ring-1 ring-black/15 ${
        showArt ? "text-white" : text
      }`}
      style={showArt ? undefined : bg}
    >
      {showArt && imageUrl && (
        <CardArtLayer
          imageUrl={imageUrl}
          alt={card.displayName}
          onError={() => setImageFailed(true)}
        />
      )}

      {!showArt && (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <EmvChip />
              <div>
                <p className="text-[0.5rem] font-bold uppercase opacity-90">
                  {card.issuer}
                </p>
                {tier && (
                  <p className="text-[0.5rem] font-semibold uppercase tracking-wider opacity-80">
                    {tier}
                  </p>
                )}
              </div>
            </div>
            <NetworkMark network={appearance.network} />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{label}</p>
            <p className="mt-0.5 line-clamp-2 text-[0.65rem] font-medium opacity-90">
              {card.displayName}
            </p>
          </div>
        </>
      )}

      {isBusiness && (
        <span
          className={`absolute bottom-3 right-3 z-10 rounded-full px-2 py-0.5 text-[0.5rem] font-bold uppercase ${
            showArt
              ? "bg-black/35 text-white backdrop-blur-sm"
              : "bg-white/25"
          }`}
        >
          Business
        </span>
      )}
    </div>
  );
}
