"use client";

import { useState, type FormEvent } from "react";
import { BadgeDollarSign, CheckCircle2, Loader2, Target } from "lucide-react";
import type { CardProduct } from "@onecard/shared-types";
import type { AdvisorRecommendation, SubProgress } from "@/server/rewards-intel/insights";
import type { HubDashboardData } from "@/data/schema";

function money(value: number): string {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

export function CardAdvisor({
  recommendation,
  subProgress,
  wallet,
  onUpdated,
}: {
  recommendation?: AdvisorRecommendation;
  subProgress: SubProgress[];
  wallet: CardProduct[];
  onUpdated: (data: HubDashboardData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/hub/sub-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, minimumSpend: Number(values.minimumSpend) }),
      });
      const body = (await response.json()) as HubDashboardData & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not track bonus");
      onUpdated(body);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not track bonus");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="oc-panel">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-ink">
        <Target className="h-5 w-5 text-brand-purple" />
        Card advisor
      </h2>
      {recommendation ? (
        <div className="mt-4 rounded-xl bg-brand-purple-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple-dark">Best next card</p>
          <p className="mt-1 text-lg font-bold text-brand-ink">{recommendation.name}</p>
          <p className="mt-2 text-sm text-brand-body">
            About <strong>+{money(recommendation.annualUplift)}/yr</strong> based on {money(recommendation.topCategorySpend)} in annualized {recommendation.topCategory.replaceAll("_", " ")} spend.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-brand-muted">{recommendation.assumptions.join(" ")}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-brand-muted">Add spending history to get an honest next-card recommendation.</p>
      )}

      <div className="mt-5 border-t border-zinc-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
            <BadgeDollarSign className="h-4 w-4" />
            Sign-up bonus tracker
          </h3>
          <button type="button" onClick={() => setOpen((value) => !value)} className="text-xs font-semibold text-brand-purple-dark hover:underline">
            {open ? "Cancel" : "Track a bonus"}
          </button>
        </div>

        {open && (
          <form onSubmit={submit} className="mt-3 grid gap-2 rounded-lg bg-zinc-50 p-3 sm:grid-cols-2">
            <select name="cardId" required className="oc-input py-2">
              {wallet.map((card) => <option key={card.cardId} value={card.cardId}>{card.displayName}</option>)}
            </select>
            <input name="minimumSpend" required type="number" min="1" step="1" placeholder="Minimum spend" className="oc-input py-2" />
            <input name="startedAt" required type="date" className="oc-input py-2" />
            <input name="deadline" required type="date" className="oc-input py-2" />
            <button disabled={busy} className="oc-btn-primary py-2 sm:col-span-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save bonus tracker
            </button>
            {error && <p className="text-xs text-red-700 sm:col-span-2">{error}</p>}
          </form>
        )}

        <div className="mt-3 space-y-2">
          {subProgress.map((progress) => (
            <div key={progress.id} className="rounded-lg border border-zinc-100 px-3 py-2.5">
              <div className="flex justify-between gap-3 text-sm">
                <p className="truncate font-medium text-brand-ink">{progress.cardName}</p>
                <p className="shrink-0 font-semibold text-brand-ink">{money(progress.spent)} / {money(progress.minimumSpend)}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-brand-mint" style={{ width: `${Math.min(100, (progress.spent / progress.minimumSpend) * 100)}%` }} />
              </div>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-brand-muted">
                {progress.status === "complete" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                {money(progress.remaining)} left by {progress.deadline} · {progress.status.replace("_", " ")}
              </p>
            </div>
          ))}
          {subProgress.length === 0 && <p className="text-xs text-brand-muted">No active bonus tracker.</p>}
        </div>
      </div>
    </section>
  );
}
