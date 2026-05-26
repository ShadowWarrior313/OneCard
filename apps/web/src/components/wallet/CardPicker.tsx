"use client";

import { Check, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { ISSUER_GROUPS, ISSUER_CARD_PAGES, cardsByIssuer } from "@/data/cards";
import { useWallet } from "@/context/WalletContext";
import { useState } from "react";
import { getCardAppearance } from "@/data/cardAppearances";
import { cardBackgroundStyle } from "@/lib/cardBackground";

function CardSwatch({ cardId, issuer }: { cardId: string; issuer: string }) {
  const a = getCardAppearance(cardId, issuer);
  return (
    <span
      className="h-7 w-11 shrink-0 rounded-md shadow-sm ring-1 ring-black/10"
      style={cardBackgroundStyle(a)}
      aria-hidden
    />
  );
}

export function CardPicker() {
  const { hasCard, toggleCard, businessCardId } = useWallet();
  const [open, setOpen] = useState<string | null>(ISSUER_GROUPS[0]);

  return (
    <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
      {ISSUER_GROUPS.map((issuer) => {
        const expanded = open === issuer;
        const list = cardsByIssuer(issuer);
        return (
          <div key={issuer}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : issuer)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                {expanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-brand-muted" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
                )}
                <span className="text-xs font-bold uppercase tracking-wide text-brand-ink">
                  {issuer}
                </span>
                <span className="text-[0.65rem] text-brand-muted">({list.length})</span>
              </span>
              <a
                href={ISSUER_CARD_PAGES[issuer]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-brand-ocean hover:underline"
              >
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                Issuer site
              </a>
            </button>
            {expanded && (
              <ul className="mt-1 space-y-1">
                {list.map((card) => {
                  const on = hasCard(card.cardId);
                  return (
                    <li key={card.cardId}>
                      <button
                        type="button"
                        onClick={() => toggleCard(card.cardId)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                          on
                            ? "bg-brand-purple-soft text-brand-purple-dark"
                            : "hover:bg-slate-50 text-brand-body"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            on
                              ? "border-brand-purple bg-brand-purple text-white"
                              : "border-slate-200"
                          }`}
                        >
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        <CardSwatch cardId={card.cardId} issuer={card.issuer} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium leading-tight">
                            {card.displayName}
                          </span>
                          {card.annualFee !== undefined && (
                            <span className="text-[0.65rem] text-brand-muted">
                              {card.annualFee === 0
                                ? "No annual fee"
                                : `$${card.annualFee}/yr`}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
