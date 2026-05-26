"use client";

import type { CardProduct } from "@onecard/shared-types";
import { RewardProfileChart } from "@/components/rewards/RewardProfileChart";
import type { MerchantPreset } from "@/data/merchants";
import { MerchantLogo } from "@/components/MerchantLogo";
import { MERCHANT_LOGO } from "@/data/merchantIcons";
import { useWallet } from "@/context/WalletContext";
import { Briefcase, Check } from "lucide-react";

const CAT: Record<string, string> = {
  groceries: "Groceries",
  dining: "Food & drink",
  travel: "Travel",
  gas: "Gas",
  streaming: "Subscriptions",
  recurring_bills: "Bills",
  other: "General",
};

export function WalletCardPopover({
  card,
  recs,
}: {
  card: CardProduct;
  recs: { merchant: MerchantPreset; multiplier: number }[];
}) {
  const { businessCardId, setBusinessCardId } = useWallet();
  const isBusiness = businessCardId === card.cardId;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {card.issuer}
          </p>
          <p className="mt-0.5 font-semibold text-brand-ink">{card.displayName}</p>
        </div>
        {isBusiness && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-ink px-2.5 py-1 text-[0.65rem] font-bold uppercase text-white">
            <Briefcase className="h-3 w-3" />
            Business
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-brand-ink">Business spending</p>
        <p className="mt-1 text-xs leading-relaxed text-brand-muted">
          Work purchases route only to this card — personal cards stay blocked so
          you never charge the wrong account.
        </p>
        <button
          type="button"
          onClick={() =>
            setBusinessCardId(isBusiness ? undefined : card.cardId)
          }
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isBusiness
              ? "bg-brand-ink text-white"
              : "border-2 border-brand-ink bg-white text-brand-ink hover:bg-brand-purple-soft"
          }`}
        >
          {isBusiness ? (
            <>
              <Check className="h-4 w-4" />
              Business card (tap to clear)
            </>
          ) : (
            <>
              <Briefcase className="h-4 w-4" />
              Set as business card
            </>
          )}
        </button>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase text-brand-muted">Rewards</p>
        <div className="mt-2">
          <RewardProfileChart card={card} compact />
        </div>
      </div>
      {recs.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase text-brand-muted">
            Best to use here
          </p>
          <ul className="mt-2 space-y-2">
            {recs.map(({ merchant, multiplier }) => (
              <li key={merchant.id} className="flex items-center gap-3">
                <MerchantLogo merchant={merchant} size={MERCHANT_LOGO.compact} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-ink">
                    {merchant.name}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {CAT[merchant.category] ?? merchant.group}
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-purple">{multiplier}×</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
