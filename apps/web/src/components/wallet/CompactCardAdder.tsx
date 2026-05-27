"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ISSUER_GROUPS, cardsByIssuer, type CardIssuerGroup } from "@/data/cards";
import { IssuerLogo } from "@/components/IssuerLogo";

function shortCardName(name: string): string {
  return name.replace(/American Express/g, "Amex").replace(/\s+Card$/i, "");
}

/** Main issuers shown first in the provider list. */
const PRIMARY_ISSUERS: CardIssuerGroup[] = [
  "American Express",
  "CIBC",
  "RBC",
  "TD",
  "Scotiabank",
  "BMO",
  "National Bank",
];

function issuerSort(a: CardIssuerGroup, b: CardIssuerGroup): number {
  const ai = PRIMARY_ISSUERS.indexOf(a);
  const bi = PRIMARY_ISSUERS.indexOf(b);
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return a.localeCompare(b);
}

export function CompactCardAdder({
  hasCard,
  onAdd,
  compact = false,
}: {
  hasCard: (id: string) => boolean;
  onAdd: (cardId: string) => void;
  /** Tighter spacing for phone demo shell. */
  compact?: boolean;
}) {
  const addableByIssuer = useMemo(() => {
    return ISSUER_GROUPS.map((issuer) => ({
      issuer,
      cards: cardsByIssuer(issuer).filter((c) => !hasCard(c.cardId)),
    }))
      .filter((g) => g.cards.length > 0)
      .sort((a, b) => issuerSort(a.issuer, b.issuer));
  }, [hasCard]);

  const [issuer, setIssuer] = useState<CardIssuerGroup | "">(
    () => addableByIssuer[0]?.issuer ?? "",
  );
  const cardsForIssuer =
    addableByIssuer.find((g) => g.issuer === issuer)?.cards ?? [];
  const [cardId, setCardId] = useState(() => cardsForIssuer[0]?.cardId ?? "");

  useEffect(() => {
    if (addableByIssuer.length === 0) return;
    const stillValid = addableByIssuer.some((g) => g.issuer === issuer);
    const nextIssuer = stillValid ? issuer : addableByIssuer[0]!.issuer;
    if (nextIssuer !== issuer) setIssuer(nextIssuer);
  }, [addableByIssuer, issuer]);

  useEffect(() => {
    const list = addableByIssuer.find((g) => g.issuer === issuer)?.cards ?? [];
    if (list.length === 0) {
      setCardId("");
      return;
    }
    if (!list.some((c) => c.cardId === cardId)) {
      setCardId(list[0]!.cardId);
    }
  }, [issuer, addableByIssuer, cardId]);

  if (addableByIssuer.length === 0) {
    return (
      <p className="text-xs text-brand-muted">All catalog cards are in your wallet.</p>
    );
  }

  const selected = cardsForIssuer.find((c) => c.cardId === cardId);

  const labelClass = compact
    ? "text-[0.6rem] font-semibold uppercase tracking-wide text-brand-muted"
    : "text-xs font-semibold uppercase tracking-wide text-brand-muted";

  const selectClass = compact
    ? "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2.5 text-xs text-brand-ink focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink/20"
    : "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-zinc-200";

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <label className="block">
        <span className={labelClass}>Card provider</span>
        <select
          value={issuer}
          onChange={(e) => setIssuer(e.target.value as CardIssuerGroup)}
          className={selectClass}
          aria-label="Card provider"
        >
          {addableByIssuer.map((g) => (
            <option key={g.issuer} value={g.issuer}>
              {g.issuer} ({g.cards.length})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>Card</span>
        <select
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className={selectClass}
          aria-label="Card to add"
          disabled={cardsForIssuer.length === 0}
        >
          {cardsForIssuer.map((card) => (
            <option key={card.cardId} value={card.cardId}>
              {shortCardName(card.displayName)}
              {card.annualFee != null
                ? card.annualFee === 0
                  ? " · No fee"
                  : ` · $${card.annualFee}/yr`
                : ""}
            </option>
          ))}
        </select>
      </label>

      {selected && (
        <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-2">
          <IssuerLogo issuer={selected.issuer} cardId={selected.cardId} size={compact ? 26 : 32} />
          <p className="min-w-0 flex-1 text-xs leading-snug text-brand-body">
            {selected.displayName}
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={!cardId}
        onClick={() => cardId && onAdd(cardId)}
        className={`inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-ink font-semibold text-white transition hover:bg-brand-charcoal disabled:cursor-not-allowed disabled:opacity-50 ${
          compact ? "py-2.5 text-xs" : "py-3 text-sm"
        }`}
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        Add to wallet
      </button>
    </div>
  );
}
