"use client";

import type { CardProduct } from "@onecard/shared-types";
import { rewardProfile } from "@/lib/recommendations";
import { getCardTheme } from "@/data/cardThemes";

export function RewardProfileChart({
  card,
  compact,
}: {
  card: CardProduct;
  compact?: boolean;
}) {
  const profile = rewardProfile(card).filter((p) => p.multiplier > 1 || !compact);
  const theme = getCardTheme(card.cardId, card.issuer);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {profile.map((row) => (
        <div
          key={row.category}
          className="grid grid-cols-[5rem_1fr_2rem] items-center gap-2"
        >
          <span className="text-xs text-brand-muted">{row.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${row.pct}%`, backgroundColor: theme.accent }}
            />
          </div>
          <span className="text-right text-xs font-semibold text-brand-ink">
            {row.multiplier}×
          </span>
        </div>
      ))}
    </div>
  );
}
