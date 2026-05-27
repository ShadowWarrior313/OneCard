"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  ANNUAL_SPEND_CATEGORIES,
  computeAnnualRewardsComparison,
  defaultMonthlySpend,
  type MonthlySpendMap,
} from "@/lib/annualRewardsEstimate";
import type { RewardCategory } from "@onecard/shared-types";

function formatMoney(n: number): string {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

function SpendSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-brand-ink">{label}</label>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-ink">
          ${value}/mo
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1500}
        step={25}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-brand-ink"
        aria-label={`${label} monthly spend`}
      />
    </div>
  );
}

export function AnnualRewardsStory() {
  const { cards, defaultCardId } = useWallet();
  const [monthlySpend, setMonthlySpend] = useState<MonthlySpendMap>(defaultMonthlySpend);

  const comparison = useMemo(
    () => computeAnnualRewardsComparison(cards, defaultCardId, monthlySpend),
    [cards, defaultCardId, monthlySpend],
  );

  function setCategory(category: RewardCategory, value: number) {
    setMonthlySpend((prev) => ({ ...prev, [category]: value }));
  }

  const totalMonthly = ANNUAL_SPEND_CATEGORIES.reduce(
    (sum, row) => sum + (monthlySpend[row.category] ?? 0),
    0,
  );

  return (
    <section className="border-b border-zinc-200 bg-white py-12 sm:py-16">
      <div className="oc-container-wide mx-auto min-w-0 max-w-3xl">
        <p className="oc-eyebrow">Your annual story</p>
        <h2 className="oc-heading mt-3 text-2xl sm:text-3xl">
          One default card vs. routing every tap
        </h2>
        <p className="mt-3 text-base leading-relaxed text-brand-muted">
          Adjust typical monthly spend by category. We estimate rewards using the same earn rates
          and caps as the simulator — with your linked wallet when available.
        </p>

        <div className="mt-8 space-y-5 rounded-xl border border-zinc-200 bg-brand-surface/60 p-5 sm:p-6">
          {ANNUAL_SPEND_CATEGORIES.map((row) => (
            <SpendSlider
              key={row.category}
              label={row.label}
              value={monthlySpend[row.category] ?? 0}
              onChange={(v) => setCategory(row.category, v)}
            />
          ))}
          <p className="border-t border-zinc-200 pt-4 text-sm text-brand-muted">
            <span className="font-semibold text-brand-ink">
              ${totalMonthly.toLocaleString()}/mo
            </span>{" "}
            total · estimates are illustrative, not a guarantee
          </p>
        </div>

        {!comparison ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Link at least one card in your{" "}
            <a href="/wallet" className="font-semibold underline">
              wallet
            </a>{" "}
            to see a personalized comparison.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 bg-gradient-to-br from-sky-50 to-white px-5 py-8 text-center sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Extra rewards per year with OneCard
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-emerald-700 sm:text-5xl">
                +{formatMoney(Math.max(0, comparison.deltaAnnual))}
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                vs. always using default payment methods
              </p>
            </div>

            <div className="grid gap-0 sm:grid-cols-2">
              <div className="border-b border-zinc-100 px-5 py-6 sm:border-b-0 sm:border-r sm:px-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Always default card
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-brand-ink">
                  {formatMoney(comparison.defaultAnnual)}
                </p>
                <p className="mt-1 text-sm text-brand-muted">estimated annual rewards</p>
              </div>
              <div className="px-5 py-6 sm:px-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  OneCard routing
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-brand-ink">
                  {formatMoney(comparison.routedAnnual)}
                </p>
                <p className="mt-1 text-sm text-brand-muted">estimated annual rewards</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
