"use client";

import type { CardProduct } from "@onecard/shared-types";
import type { RoutingDecision } from "@onecard/shared-types";
import { getCardTheme } from "@/data/cardThemes";
import type { MerchantPreset } from "@/data/merchants";
import { issuerLogoSrc } from "@/data/logos";
import { BrandLogo } from "@/components/BrandLogo";
import { MerchantLogo } from "@/components/MerchantLogo";
import { MERCHANT_LOGO } from "@/data/merchantIcons";
import { useMemo, useState, type ReactNode } from "react";

const VISIBLE = 4;

function shortCardName(name: string): string {
  if (name.length <= 22) return name;
  return name.replace(/American Express/g, "Amex").slice(0, 22) + "…";
}

function IssuerMark({
  issuer,
  cardId,
  size = 40,
}: {
  issuer: string;
  cardId: string;
  size?: number;
}) {
  const theme = getCardTheme(cardId, issuer);
  const src = issuerLogoSrc(issuer);

  return (
    <BrandLogo
      src={src}
      alt={issuer}
      size={size}
      rounded="lg"
      fallback={
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ width: size, height: size, backgroundColor: theme.accent }}
        >
          {issuer.charAt(0)}
        </span>
      }
    />
  );
}

export function RewardsComparisonTable({
  decision,
  merchant,
  cards,
  defaultCardId,
  sym,
  totalCharged,
}: {
  decision: RoutingDecision;
  merchant: MerchantPreset;
  cards: CardProduct[];
  defaultCardId: string | null;
  sym: string;
  totalCharged: number;
}) {
  const [showAll, setShowAll] = useState(false);

  const cardsById = useMemo(
    () => new Map(cards.map((c) => [c.cardId, c])),
    [cards],
  );

  const defaultAlt = decision.alternatives.find(
    (a) => a.cardId === defaultCardId,
  );
  const defaultEarnCents = defaultAlt?.estimatedRewardValueCents ?? 0;

  const columns = showAll
    ? decision.alternatives
    : decision.alternatives.slice(0, VISIBLE);

  const winnerId = decision.selectedCardId;

  const rows: {
    label: string;
    hint?: string;
    primary?: boolean;
    value: (alt: (typeof columns)[0], isWinner: boolean) => ReactNode;
  }[] = [
    {
      label: "You earn",
      hint: "Estimated reward on this purchase",
      primary: true,
      value: (alt, isWinner) => {
        const v = (alt.estimatedRewardValueCents / 100).toFixed(2);
        return (
          <span
            className={`text-lg font-bold tabular-nums sm:text-xl ${
              isWinner
                ? "text-brand-ink"
                : "text-red-600"
            }`}
          >
            {sym}
            {v}
          </span>
        );
      },
    },
    {
      label: "Earn rate",
      value: (alt) => (
        <span className="text-sm font-medium text-brand-body tabular-nums">
          {alt.multiplier}×{" "}
          <span className="text-brand-muted">{alt.category.replace(/_/g, " ")}</span>
        </span>
      ),
    },
    {
      label: "vs your default",
      value: (alt) => {
        const delta =
          (alt.estimatedRewardValueCents - defaultEarnCents) / 100;
        if (alt.cardId === defaultCardId) {
          return <span className="text-sm text-brand-muted">—</span>;
        }
        const sign = delta >= 0 ? "+" : "";
        return (
          <span
            className={`text-sm font-semibold tabular-nums ${
              delta > 0 ? "text-brand-ink" : "text-red-600"
            }`}
          >
            {sign}
            {sym}
            {delta.toFixed(2)}
          </span>
        );
      },
    },
    {
      label: "Bonus cap",
      value: (alt) => (
        <span className="text-sm text-brand-body">
          {alt.cappedOut ? (
            <span className="text-amber-700">Cap reached</span>
          ) : (
            "Available"
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-brand-mint bg-white shadow-card">
      {/* Summary bar — mirrors Wise amount / from / to */}
      <div className="grid gap-4 border-b border-slate-200/80 bg-slate-50/60 px-4 py-4 sm:grid-cols-3 sm:px-5">
        <div>
          <p className="text-xs font-medium text-brand-muted">Merchant</p>
          <div className="mt-1.5 flex items-center gap-2">
            <MerchantLogo merchant={merchant} size={MERCHANT_LOGO.tile} />
            <span className="font-semibold text-brand-ink">{merchant.name}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-brand-muted">Purchase</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-brand-ink">
            {sym}
            {totalCharged.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-brand-muted">OneCard picks</p>
          <p className="mt-1 text-sm font-bold text-brand-ink">
            {decision.selectedCardDisplayName}
          </p>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[36rem]">
          {/* Column headers */}
          <div
            className="grid border-b border-slate-200/80"
            style={{
              gridTemplateColumns: `minmax(7.5rem, 1.1fr) repeat(${columns.length}, minmax(5.5rem, 1fr))`,
            }}
          >
            <div className="px-4 py-4" />
            {columns.map((alt) => {
              const card = cardsById.get(alt.cardId);
              const isWinner = alt.cardId === winnerId;
              const isDefault = alt.cardId === defaultCardId;
              return (
                <div
                  key={alt.cardId}
                  className={`flex flex-col items-center px-3 py-4 text-center ${
                    isWinner
                      ? "rounded-t-xl bg-[#B2FCE4]/70"
                      : ""
                  }`}
                >
                  {card && (
                    <IssuerMark
                      issuer={card.issuer}
                      cardId={alt.cardId}
                      size={44}
                    />
                  )}
                  <p className="mt-2 text-xs font-semibold leading-tight text-brand-ink">
                    {shortCardName(alt.displayName)}
                  </p>
                  {isWinner && (
                    <span className="mt-1.5 rounded-full bg-brand-ink px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                      Best
                    </span>
                  )}
                  {isDefault && !isWinner && (
                    <span className="mt-1.5 text-[0.65rem] font-medium text-brand-muted underline decoration-brand-muted/40">
                      Your default
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {rows.map((row, rowIdx) => (
            <div
              key={row.label}
              className={`grid border-b border-slate-100 last:border-0 ${
                rowIdx % 2 === 1 ? "bg-slate-50/40" : ""
              }`}
              style={{
                gridTemplateColumns: `minmax(7.5rem, 1.1fr) repeat(${columns.length}, minmax(5.5rem, 1fr))`,
              }}
            >
              <div className="flex flex-col justify-center px-4 py-3.5">
                <span className="text-sm font-medium text-brand-body">
                  {row.label}
                </span>
                {row.hint && (
                  <span className="mt-0.5 text-[0.65rem] text-brand-muted">
                    {row.hint}
                  </span>
                )}
              </div>
              {columns.map((alt) => {
                const isWinner = alt.cardId === winnerId;
                return (
                  <div
                    key={`${row.label}-${alt.cardId}`}
                    className={`flex items-center justify-center px-3 py-3.5 text-center ${
                      isWinner ? "bg-[#B2FCE4]/50" : ""
                    }`}
                  >
                    {row.value(alt, isWinner)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {decision.alternatives.length > VISIBLE && (
        <div className="border-t border-slate-100 py-3 text-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-sm font-semibold text-brand-ink underline decoration-brand-ink/30 underline-offset-2 hover:decoration-brand-ink"
          >
            {showAll
              ? "Show fewer cards"
              : `Show all ${decision.alternatives.length} cards in wallet`}
          </button>
        </div>
      )}

      <p className="border-t border-slate-100 px-4 py-3 text-center text-xs text-brand-muted sm:px-5">
        {decision.reason}
      </p>
    </div>
  );
}
