"use client";

import { useWallet } from "@/context/WalletContext";
import { Briefcase, AlertCircle } from "lucide-react";
export function BusinessCardPanel() {
  const { cards, businessCardId, setBusinessCardId } = useWallet();
  const businessCard = cards.find((c) => c.cardId === businessCardId);

  return (
    <div className="oc-panel border-2 border-brand-ink/10">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple-soft text-brand-purple">
          <Briefcase className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Business card</h2>
          <p className="mt-1 text-sm leading-relaxed text-brand-muted">
            Choose one card for work expenses. OneCard will only route business
            purchases to this card — never your personal cards.
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="mt-4 text-sm text-brand-muted">Add cards first.</p>
      ) : (
        <div className="mt-4 space-y-2">
          <label htmlFor="business-card-select" className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Designated business card
          </label>
          <select
            id="business-card-select"
            value={businessCardId ?? ""}
            onChange={(e) =>
              setBusinessCardId(e.target.value ? e.target.value : undefined)
            }
            className="oc-input"
          >
            <option value="">None selected</option>
            {cards.map((c) => (
              <option key={c.cardId} value={c.cardId}>
                {c.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {businessCard ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-mint-soft px-3 py-2 text-sm font-medium text-brand-ink">
          <Briefcase className="h-4 w-4 shrink-0" />
          {businessCard.displayName} is your business card
        </p>
      ) : (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Set a business card before running business purchases in the simulator.
        </p>
      )}

      <p className="mt-3 text-xs text-brand-muted">
        Or slide a card out and tap <strong>Set as business card</strong>.
      </p>
    </div>
  );
}
