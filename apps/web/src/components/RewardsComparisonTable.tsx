"use client";

import type { CardProduct } from "@onecard/shared-types";
import type { RoutingDecision } from "@onecard/shared-types";
import type { MerchantPreset } from "@/data/merchants";
import { IssuerLogo } from "@/components/IssuerLogo";
import { MerchantLogo } from "@/components/MerchantLogo";
import { MERCHANT_LOGO } from "@/data/merchantIcons";
import { formatDecimal } from "@/lib/formatNumber";
import { formatEffectiveRewardPercent } from "@/data/cardRewards";
import { useMemo, useState, type ReactNode } from "react";

const VISIBLE = 4;

function comparisonMinWidth(columnCount: number): string {
  return `${8.5 + columnCount * 7.25}rem`;
}

const GRID_COLUMNS = (count: number) =>
  `minmax(8rem, 1.15fr) repeat(${count}, minmax(7rem, 1fr))`;

function CellValue({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 max-w-full flex-col items-center justify-center gap-0.5 text-center ${className}`}
    >
      {children}
    </div>
  );
}

function shortCardName(name: string): string {
  if (name.length <= 22) return name;
  return name.replace(/American Express/g, "Amex").slice(0, 22) + "…";
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
  const winnerId = decision.selectedCardId;

  const columns = showAll
    ? decision.alternatives
    : decision.alternatives.slice(0, VISIBLE);

  const rows: {
    label: string;
    hint?: string;
    value: (alt: (typeof columns)[0], isWinner: boolean) => ReactNode;
  }[] = [
    {
      label: "You earn",
      hint: "Estimated reward on this purchase",
      value: (alt, isWinner) => {
        const v = formatDecimal(alt.estimatedRewardValueCents / 100, 1);
        return (
          <CellValue>
            <span
              className={`max-w-full break-words text-base font-bold tabular-nums leading-tight ${
                isWinner ? "text-brand-ink" : "text-red-600"
              }`}
            >
              {sym}
              {v}
            </span>
          </CellValue>
        );
      },
    },
    {
      label: "Effective rate",
      hint: "Normalized reward value on this purchase",
      value: (alt) => (
        <CellValue>
          <span className="max-w-full break-words text-sm font-medium tabular-nums text-brand-body">
            {formatEffectiveRewardPercent(alt.estimatedRewardValueCents, totalCharged)}
          </span>
          <span className="max-w-full break-words text-xs leading-snug text-brand-muted">
            {alt.category.replace(/_/g, " ")}
          </span>
        </CellValue>
      ),
    },
    {
      label: "vs your default",
      value: (alt) => {
        const delta = (alt.estimatedRewardValueCents - defaultEarnCents) / 100;
        if (alt.cardId === defaultCardId) {
          return <span className="text-sm text-brand-muted">—</span>;
        }
        const sign = delta >= 0 ? "+" : "";
        return (
          <CellValue>
            <span
              className={`max-w-full break-words text-sm font-semibold tabular-nums leading-tight ${
                delta > 0 ? "text-brand-ink" : "text-red-600"
              }`}
            >
              {sign}
              {sym}
              {formatDecimal(delta, 1)}
            </span>
          </CellValue>
        );
      },
    },
    {
      label: "Bonus cap",
      value: (alt) => (
        <CellValue>
          <span className="max-w-full break-words text-sm text-brand-body">
            {alt.cappedOut ? (
              <span className="text-amber-700">Cap reached</span>
            ) : (
              "Available"
            )}
          </span>
        </CellValue>
      ),
    },
  ];

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="grid gap-4 border-b border-zinc-100 px-4 py-4 sm:grid-cols-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-muted">Merchant</p>
          <div className="mt-1.5 flex min-w-0 items-center gap-2">
            <MerchantLogo merchant={merchant} size={MERCHANT_LOGO.tile} />
            <span className="min-w-0 break-words font-semibold text-brand-ink">
              {merchant.name}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-muted">Purchase</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-brand-ink">
            {sym}
            {totalCharged.toFixed(2)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-muted">OneCard picks</p>
          <p className="mt-1 line-clamp-2 break-words text-sm font-bold text-brand-ink">
            {decision.selectedCardDisplayName}
          </p>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="divide-y divide-zinc-100 md:hidden">
        {columns.map((alt) => {
          const card = cardsById.get(alt.cardId);
          const isWinner = alt.cardId === winnerId;
          const isDefault = alt.cardId === defaultCardId;
          return (
            <div
              key={alt.cardId}
              className={`px-4 py-4 ${isWinner ? "bg-emerald-50/60" : ""}`}
            >
              <div className="flex items-center gap-3">
                {card && (
                  <IssuerLogo issuer={card.issuer} cardId={alt.cardId} size={36} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-brand-ink">
                    {alt.displayName}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {isWinner && (
                      <span className="rounded bg-brand-ink px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-white">
                        Best
                      </span>
                    )}
                    {isDefault && !isWinner && (
                      <span className="text-xs text-brand-muted">Your default</span>
                    )}
                  </div>
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums text-brand-ink">
                  {sym}
                  {formatDecimal(alt.estimatedRewardValueCents / 100, 1)}
                </p>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-brand-muted">Effective rate</dt>
                  <dd className="font-medium text-brand-body">
                    {formatEffectiveRewardPercent(alt.estimatedRewardValueCents, totalCharged)}{" "}
                    · {alt.category.replace(/_/g, " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-brand-muted">Bonus cap</dt>
                  <dd className="font-medium text-brand-body">
                    {alt.cappedOut ? "Cap reached" : "Available"}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      {/* Desktop: comparison grid */}
      <div className="hidden overflow-x-auto overscroll-x-contain md:block">
        <div
          className="w-max min-w-full pr-3"
          style={{ minWidth: comparisonMinWidth(columns.length) }}
        >
          <div
            className="grid border-b border-zinc-100"
            style={{ gridTemplateColumns: GRID_COLUMNS(columns.length) }}
          >
            <div className="px-4 py-4" />
            {columns.map((alt) => {
              const card = cardsById.get(alt.cardId);
              const isWinner = alt.cardId === winnerId;
              const isDefault = alt.cardId === defaultCardId;
              return (
                <div
                  key={alt.cardId}
                  className={`flex min-w-0 flex-col items-center px-2 py-4 text-center sm:px-3 ${
                    isWinner ? "rounded-t-lg bg-emerald-50/70" : ""
                  }`}
                >
                  {card && (
                    <IssuerLogo issuer={card.issuer} cardId={alt.cardId} size={44} />
                  )}
                  <p className="mt-2 max-w-full break-words text-xs font-semibold leading-snug text-brand-ink">
                    {shortCardName(alt.displayName)}
                  </p>
                  {isWinner && (
                    <span className="mt-1.5 rounded bg-brand-ink px-2 py-0.5 text-[0.6rem] font-bold uppercase text-white">
                      Best
                    </span>
                  )}
                  {isDefault && !isWinner && (
                    <span className="mt-1.5 text-[0.65rem] font-medium text-brand-muted">
                      Your default
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {rows.map((row, rowIdx) => (
            <div
              key={row.label}
              className={`grid border-b border-zinc-50 last:border-0 ${
                rowIdx % 2 === 1 ? "bg-zinc-50/50" : ""
              }`}
              style={{ gridTemplateColumns: GRID_COLUMNS(columns.length) }}
            >
              <div className="flex min-w-0 flex-col justify-center px-4 py-3.5">
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
                    className={`flex min-w-0 items-center justify-center px-2 py-3.5 sm:px-3 ${
                      isWinner ? "bg-emerald-50/50" : ""
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
        <div className="border-t border-zinc-100 py-3 text-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-sm font-semibold text-brand-ink underline decoration-zinc-300 underline-offset-2 hover:decoration-brand-ink"
          >
            {showAll
              ? "Show fewer cards"
              : `Show all ${decision.alternatives.length} cards in wallet`}
          </button>
        </div>
      )}

      <p className="border-t border-zinc-100 px-4 py-3 text-center text-xs leading-relaxed text-brand-muted sm:px-5">
        <span className="break-words">{decision.reason}</span>
      </p>
    </div>
  );
}
