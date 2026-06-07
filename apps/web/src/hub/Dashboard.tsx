"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CreditCard, Landmark, Loader2, Plus, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { useUserProfile } from "@/context/UserProfileContext";
import { useWallet } from "@/context/WalletContext";
import { WalletCardVisual } from "@/components/wallet/WalletCardVisual";
import type { HubDashboardData } from "@/data/schema";
import type { ProviderId } from "@/server/data-providers/types";
import type { RewardsSummaryData } from "@/server/rewards-intel/earned-vs-optimal";
import type { AdvisorRecommendation, SubProgress, TrackerData } from "@/server/rewards-intel/insights";
import { LinkAccountButton } from "./LinkAccountButton";
import { ConnectionHealth } from "./ConnectionHealth";
import { RewardsSummary } from "./RewardsSummary";
import { CapTracker } from "./CapTracker";
import { CardAdvisor } from "./CardAdvisor";

const EMPTY_DATA: HubDashboardData = { items: [], accounts: [], transactions: [], subTrackers: [] };

interface InsightsPayload {
  summary: RewardsSummaryData;
  trackers: TrackerData;
  recommendation?: AdvisorRecommendation;
  subProgress: SubProgress[];
}

const EMPTY_INSIGHTS: InsightsPayload = {
  summary: {
    month: new Date().toISOString().slice(0, 7),
    spent: 0,
    earned: 0,
    optimal: 0,
    missed: 0,
    estimatedTransactions: 0,
    unmappedTransactions: 0,
    categoryBreakdown: [],
    topMissed: [],
  },
  trackers: { caps: [], alerts: [] },
  recommendation: undefined,
  subProgress: [],
};

export function Dashboard() {
  const { profile, hydrated, isLoggedIn } = useUserProfile();
  const { cards, cardIds } = useWallet();
  const [data, setData] = useState<HubDashboardData>(EMPTY_DATA);
  const [insights, setInsights] = useState<InsightsPayload>(EMPTY_INSIGHTS);
  const [provider, setProvider] = useState<ProviderId>("mock");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!profile || !isLoggedIn) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      await fetch("/api/hub/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      const [providerResponse, dashboardResponse] = await Promise.all([
        fetch("/api/hub/provider"),
        fetch("/api/hub/dashboard"),
      ]);
      if (providerResponse.ok) {
        setProvider(((await providerResponse.json()) as { provider: ProviderId }).provider);
      }
      const body = (await dashboardResponse.json()) as HubDashboardData & { error?: string };
      if (!dashboardResponse.ok) throw new Error(body.error ?? "Could not load your optimizer");
      setData(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your optimizer");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  useEffect(() => {
    if (hydrated) void load();
  }, [hydrated, load]);

  // Rewards intelligence is computed SERVER-SIDE; we send only the wallet ids.
  const loadInsights = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const response = await fetch("/api/hub/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletCardIds: cardIds }),
      });
      if (response.ok) setInsights((await response.json()) as InsightsPayload);
    } catch {
      // Non-fatal: keep the last insights; the error surface is the data fetch.
    }
  }, [cardIds, isLoggedIn]);

  useEffect(() => {
    if (hydrated && isLoggedIn) void loadInsights();
  }, [data, hydrated, isLoggedIn, loadInsights]);

  async function sync() {
    setSyncing(true);
    setError("");
    try {
      const response = await fetch("/api/hub/sync", { method: "POST" });
      const body = (await response.json()) as HubDashboardData & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not refresh transactions");
      setData(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh transactions");
    } finally {
      setSyncing(false);
    }
  }

  async function mapAccount(accountId: string, cardId: string) {
    const response = await fetch("/api/hub/accounts/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, cardId: cardId || null }),
    });
    if (response.ok) {
      setData((current) => ({
        ...current,
        accounts: current.accounts.map((account) =>
          account.id === accountId ? { ...account, trackedCardId: cardId || undefined } : account,
        ),
      }));
    }
  }

  async function addManualTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/hub/manual-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, amount: Number(values.amount) }),
    });
    const body = (await response.json()) as HubDashboardData & { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not add transaction");
      return;
    }
    setData(body);
    setManualOpen(false);
  }

  if (!hydrated || loading) {
    return <div className="oc-panel mx-auto mt-10 h-64 max-w-6xl animate-pulse bg-white/70" aria-label="Loading optimizer" />;
  }

  if (!isLoggedIn) {
    return (
      <section className="oc-panel mx-auto mt-10 max-w-xl text-center">
        <ShieldCheck className="mx-auto h-9 w-9 text-brand-purple" />
        <h1 className="mt-4 text-2xl font-semibold text-brand-ink">Log in to open your rewards hub</h1>
        <p className="mt-2 text-sm text-brand-muted">Your imported transactions are available only through authenticated server routes.</p>
        <Link href="/login?next=/hub" className="oc-btn-primary mt-5">Log in <ArrowRight className="h-4 w-4" /></Link>
      </section>
    );
  }

  return (
    <div className="oc-container-wide pb-16 pt-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="oc-eyebrow inline-flex items-center gap-1.5"><WalletCards className="h-3.5 w-3.5" /> Rewards hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">Your wallet, optimized</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">Import purchases, see where rewards slipped away, track caps, and decide which card earns its place next.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setManualOpen((value) => !value)} className="oc-btn-secondary px-4 py-2.5"><Plus className="h-4 w-4" /> Add purchase</button>
          <LinkAccountButton provider={provider} onImported={setData} />
          {data.items.length > 0 && <button type="button" onClick={sync} disabled={syncing} className="oc-btn-secondary px-4 py-2.5">{syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh</button>}
        </div>
      </header>

      {error && <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {manualOpen && (
        <form onSubmit={addManualTransaction} className="oc-panel mt-5 grid gap-3 sm:grid-cols-4">
          <input required name="merchantName" placeholder="Merchant, e.g. Safeway" className="oc-input py-2.5" />
          <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" className="oc-input py-2.5" />
          <input required name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="oc-input py-2.5" />
          <select required name="cardId" className="oc-input py-2.5">
            {cards.map((card) => <option key={card.cardId} value={card.cardId}>{card.displayName}</option>)}
          </select>
          <button className="oc-btn-primary py-2.5 sm:col-span-4">Add estimated purchase</button>
        </form>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-5">
          <RewardsSummary summary={insights.summary} />
          <section className="oc-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-ink"><CreditCard className="h-5 w-5 text-brand-ocean" /> Wallet cards</h2>
              <Link href="/wallet" className="text-xs font-semibold text-brand-purple-dark hover:underline">Manage wallet</Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => {
                const masks = data.accounts.filter((account) => account.trackedCardId === card.cardId).map((account) => account.mask).filter(Boolean);
                return <div key={card.cardId}><WalletCardVisual card={card} /><p className="mt-2 text-xs text-brand-muted">{masks.length ? `Linked ·•••• ${masks.join(", ")}` : "Manual wallet card · link an account to match transactions"}</p></div>;
              })}
            </div>
          </section>

          {data.accounts.length > 0 && (
            <section className="oc-panel">
              <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-ink"><Landmark className="h-5 w-5 text-brand-purple" /> Confirm imported accounts</h2>
              <p className="mt-1 text-sm text-brand-muted">Map safe account metadata to the card in your OneCard wallet. No card numbers are stored.</p>
              <div className="mt-4 space-y-2">
                {data.accounts.map((account) => (
                  <label key={account.id} className="grid items-center gap-2 rounded-lg border border-zinc-100 px-3 py-2 sm:grid-cols-[1fr_minmax(12rem,20rem)]">
                    <span className="text-sm text-brand-body">{account.officialName ?? account.name} {account.mask ? `·•••• ${account.mask}` : ""}</span>
                    <select value={account.trackedCardId ?? ""} onChange={(event) => void mapAccount(account.id, event.target.value)} className="oc-input py-2">
                      <option value="">Choose tracked card</option>
                      {cards.map((card) => <option key={card.cardId} value={card.cardId}>{card.displayName}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-5">
          <ConnectionHealth items={data.items} onUpdated={setData} />
          <CapTracker trackers={insights.trackers} />
          <CardAdvisor recommendation={insights.recommendation} subProgress={insights.subProgress} wallet={cards} onUpdated={setData} />
          <section className="oc-panel text-xs leading-relaxed text-brand-muted">
            <p className="font-semibold text-brand-ink">Read-only and advisory only</p>
            <p className="mt-1">OneCard imports transaction records to advise on rewards. It never processes, proxies, or fronts a card transaction, and never moves money. Provider access tokens stay encrypted server-side; no card numbers are stored.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
