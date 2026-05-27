"use client";

import type { CardProduct } from "@onecard/shared-types";
import { getCardAppearance, tierLabel } from "@/data/cardAppearances";
import { cardBackgroundStyle, cardTextClass } from "@/lib/cardBackground";
import { PaymentNetworkLogo } from "@/components/PaymentNetworkLogo";
import { IssuerLogo } from "@/components/IssuerLogo";

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
  return (
    <PaymentNetworkLogo
      network={network}
      size={network === "mastercard" ? 22 : 20}
      style="logo-border"
      className="drop-shadow-sm"
    />
  );
}

function CardTexture() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(255,255,255,0.14),transparent_40%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.1)_0%,transparent_28%,transparent_72%,rgba(255,255,255,0.07)_100%)]" />
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
  if (peek) {
    return (
      <div
        className={`relative flex h-11 w-full items-center justify-between overflow-hidden rounded-t-2xl px-3 pb-1.5 pt-2 shadow-md ring-1 ring-black/15 ${text} ${
          active ? "shadow-lg ring-2 ring-brand-ink/25" : ""
        }`}
        style={bg}
      >
        <CardTexture />
        <div className="relative z-10 flex min-w-0 items-center gap-2">
          <IssuerLogo issuer={card.issuer} cardId={card.cardId} size={16} className="rounded" />
          <span
            className="truncate text-[0.55rem] font-bold uppercase tracking-wide"
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
          <NetworkMark network={appearance.network} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-xl ring-1 ring-black/15 ${text}`}
      style={bg}
    >
      <CardTexture />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <IssuerLogo issuer={card.issuer} cardId={card.cardId} size={22} className="rounded-md" />
          <div className="min-w-0">
            <p className="truncate text-[0.5rem] font-bold uppercase opacity-90">
              {card.issuer}
            </p>
            {tier && (
              <p className="text-[0.5rem] font-semibold uppercase tracking-wider opacity-80">
                {tier}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EmvChip />
          <NetworkMark network={appearance.network} />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-lg font-bold leading-tight">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-[0.65rem] font-medium opacity-90">
          {card.displayName}
        </p>
      </div>

      {isBusiness && (
        <span
          className="absolute bottom-3 right-3 z-10 rounded-full bg-white/25 px-2 py-0.5 text-[0.5rem] font-bold uppercase"
        >
          Business
        </span>
      )}
    </div>
  );
}
