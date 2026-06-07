"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { getCardById } from "@/data/cards";
import type { RewardsSummaryData } from "@/server/rewards-intel/earned-vs-optimal";

function money(value: number): string {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function RewardsSummary({ summary }: { summary: RewardsSummaryData }) {
  const [animatedMissed, setAnimatedMissed] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const duration = 650;
    let frame = 0;
    function update(now: number) {
      const progress = Math.min(1, (now - started) / duration);
      setAnimatedMissed(summary.missed * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [summary.missed]);

  return (
    <section className="oc-panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="oc-eyebrow inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-purple" />
            Rewards optimizer
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
            You missed about {money(animatedMissed)} this month
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted">
            Estimated from predicted reward categories. OneCard never receives the card-network MCC, so every estimate carries category confidence.
          </p>
        </div>
        <div className="rounded-xl bg-brand-mint-soft px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Earned</p>
          <p className="mt-1 text-xl font-bold text-emerald-900">{money(summary.earned)}</p>
          <p className="text-xs text-emerald-800">of {money(summary.optimal)} possible</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {summary.categoryBreakdown.slice(0, 3).map((category) => (
          <div key={category.category} className="oc-panel-inset">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{category.category.replaceAll("_", " ")}</p>
            <p className="mt-1 text-lg font-bold text-brand-ink">{money(category.missed)} missed</p>
            <p className="text-xs text-brand-muted">{money(category.spent)} spend</p>
          </div>
        ))}
        {summary.categoryBreakdown.length === 0 && (
          <p className="sm:col-span-3 text-sm text-brand-muted">Add a purchase or link Plaid to see this month's category breakdown.</p>
        )}
      </div>

      {summary.topMissed.length > 0 && (
        <div className="mt-6 border-t border-zinc-100 pt-5">
          <h3 className="text-sm font-semibold text-brand-ink">Largest missed opportunities</h3>
          <div className="mt-3 space-y-2">
            {summary.topMissed.map(({ transaction, missed, optimalCardId }) => (
              <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-ink">{transaction.merchantName}</p>
                  <p className="truncate text-xs text-brand-muted">
                    {transaction.categorized.category.replaceAll("_", " ")} · {Math.round(transaction.categorized.confidence * 100)}% confidence
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="inline-flex items-center text-sm font-bold text-brand-ink">
                    +{money(missed)} <ArrowUpRight className="h-3.5 w-3.5" />
                  </p>
                  <p className="max-w-44 truncate text-xs text-brand-muted">{optimalCardId ? getCardById(optimalCardId)?.displayName : "Map your card"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
