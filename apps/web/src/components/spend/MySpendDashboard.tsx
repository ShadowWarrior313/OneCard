"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, BarChart3, Trash2 } from "lucide-react";
import { useSpend } from "@/context/SpendContext";
import {
  aggregateByCard,
  aggregateByCategory,
  categoryLabel,
  filterRecordsInRange,
  getPeriodRange,
  monthlyBuckets,
  shortCardName,
  summarizeRecords,
  type SpendPeriod,
} from "@/lib/spendHistory";

const PERIODS: { id: SpendPeriod; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
];

type ChartMetric = "spend" | "rewards";
type CompareBy = "card" | "category";

const CHART_MARGIN = { top: 8, right: 8, left: -12, bottom: 8 };
const CHART_MARGIN_LABELS = { top: 8, right: 8, left: -12, bottom: 56 };

function money(n: number, compact = false): string {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: compact ? 0 : 2,
  });
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-brand-muted">{subtitle}</p>}
      <div className="mt-4 h-52 w-full min-w-0 sm:h-64">{children}</div>
    </div>
  );
}

export function MySpendDashboard() {
  const { records, hydrated, removeRecord, clearHistory } = useSpend();
  const [period, setPeriod] = useState<SpendPeriod>("month");
  const [metric, setMetric] = useState<ChartMetric>("spend");
  const [compareBy, setCompareBy] = useState<CompareBy>("category");

  const range = useMemo(() => getPeriodRange(period), [period]);

  const currentRecords = useMemo(
    () => filterRecordsInRange(records, range.start, range.end),
    [records, range],
  );
  const previousRecords = useMemo(
    () => filterRecordsInRange(records, range.prevStart, range.prevEnd),
    [records, range],
  );

  const summary = useMemo(() => summarizeRecords(currentRecords), [currentRecords]);
  const prevSummary = useMemo(() => summarizeRecords(previousRecords), [previousRecords]);

  const byCard = useMemo(() => aggregateByCard(currentRecords), [currentRecords]);
  const byCategory = useMemo(() => aggregateByCategory(currentRecords), [currentRecords]);

  const cardChartData = useMemo(
    () =>
      byCard.map((row) => ({
        name: row.name.length > 14 ? `${row.name.slice(0, 12)}…` : row.name,
        spend: Math.round(row.spend * 100) / 100,
        rewards: Math.round(row.rewards * 100) / 100,
      })),
    [byCard],
  );

  const categoryChartData = useMemo(
    () =>
      byCategory.map((row) => ({
        name: row.label,
        spend: Math.round(row.spend * 100) / 100,
        rewards: Math.round(row.rewards * 100) / 100,
      })),
    [byCategory],
  );

  const compareData = useMemo(() => {
    if (compareBy === "card") {
      const cur = aggregateByCard(currentRecords);
      const prev = aggregateByCard(previousRecords);
      const keys = new Set([...cur.map((c) => c.cardId), ...prev.map((p) => p.cardId)]);
      return [...keys]
        .map((cardId) => {
          const c = cur.find((x) => x.cardId === cardId);
          const p = prev.find((x) => x.cardId === cardId);
          const label = c?.name ?? p?.name ?? cardId;
          return {
            name: label.length > 12 ? `${label.slice(0, 10)}…` : label,
            current: metric === "spend" ? (c?.spend ?? 0) : (c?.rewards ?? 0),
            previous: metric === "spend" ? (p?.spend ?? 0) : (p?.rewards ?? 0),
          };
        })
        .sort((a, b) => b.current - a.current);
    }

    const cur = aggregateByCategory(currentRecords);
    const prev = aggregateByCategory(previousRecords);
    const keys = new Set([...cur.map((c) => c.category), ...prev.map((p) => p.category)]);
    return [...keys]
      .map((cat) => {
        const c = cur.find((x) => x.category === cat);
        const p = prev.find((x) => x.category === cat);
        const label = c?.label ?? p?.label ?? cat;
        return {
          name: label.length > 12 ? `${label.slice(0, 10)}…` : label,
          current: metric === "spend" ? (c?.spend ?? 0) : (c?.rewards ?? 0),
          previous: metric === "spend" ? (p?.spend ?? 0) : (p?.rewards ?? 0),
        };
      })
      .sort((a, b) => b.current - a.current);
  }, [compareBy, currentRecords, previousRecords, metric]);

  const monthlyData = useMemo(() => {
    if (period !== "year") return [];
    const year = new Date().getFullYear();
    return monthlyBuckets(records, year).map((m) => ({
      name: m.label,
      spend: Math.round(m.spend),
      rewards: Math.round(m.rewards * 100) / 100,
    }));
  }, [records, period]);

  if (!hydrated) {
    return <p className="text-sm text-brand-muted">Loading spend history…</p>;
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-brand-muted" strokeWidth={1.25} />
        <p className="mt-4 text-lg font-semibold text-brand-ink">No purchases logged yet</p>
        <p className="mt-2 text-sm text-brand-muted">
          Run a purchase in the simulator and tap <strong>Log to My Spend</strong> to start tracking
          spend, categories, and rewards by card.
        </p>
        <Link
          href="/simulator"
          className="mt-6 inline-flex w-full min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal sm:w-auto"
        >
          Open simulator
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period + metric controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="grid grid-cols-4 gap-1 rounded-lg border border-zinc-200 bg-white p-1 sm:flex sm:w-auto sm:flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`min-h-[44px] rounded-md px-2 py-2 text-xs font-semibold transition sm:px-3 sm:py-1.5 sm:text-sm ${
                period === p.id ? "bg-brand-ink text-white" : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex w-full sm:w-auto">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as ChartMetric)}
            className="min-h-[44px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-brand-ink sm:w-auto"
            aria-label="Chart metric"
          >
            <option value="spend">Dollars spent</option>
            <option value="rewards">Rewards earned</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total spent", value: money(summary.spend) },
          { label: "Rewards earned", value: money(summary.rewards) },
          { label: "Extra vs default", value: money(Math.max(0, summary.extra)) },
          { label: "Purchases", value: String(summary.count) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-brand-ink sm:text-xl">{stat.value}</p>
            <p className="mt-0.5 text-xs text-brand-muted">{range.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Spend by card" subtitle={range.label}>
          {cardChartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-brand-muted">
              No spend this period
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cardChartData} margin={CHART_MARGIN_LABELS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={56}
                />
                <YAxis tick={{ fontSize: 10 }} width={44} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey={metric} fill="#0a0a0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Spend by category" subtitle={range.label}>
          {categoryChartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-brand-muted">
              No spend this period
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} width={44} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey={metric} fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Period comparison */}
      <ChartCard
        title="Period comparison"
        subtitle={`${range.label} vs ${range.prevLabel}`}
      >
        <p className="mb-2 text-xs text-brand-muted sm:hidden">
          Comparing {metric === "spend" ? "spend" : "rewards"}
        </p>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setCompareBy("category")}
            className={`min-h-[44px] rounded-md px-3 py-2 text-xs font-semibold sm:min-h-0 sm:px-2.5 sm:py-1 ${
              compareBy === "category" ? "bg-zinc-100 text-brand-ink" : "text-brand-muted"
            }`}
          >
            By category
          </button>
          <button
            type="button"
            onClick={() => setCompareBy("card")}
            className={`min-h-[44px] rounded-md px-3 py-2 text-xs font-semibold sm:min-h-0 sm:px-2.5 sm:py-1 ${
              compareBy === "card" ? "bg-zinc-100 text-brand-ink" : "text-brand-muted"
            }`}
          >
            By card
          </button>
        </div>
        {compareData.length === 0 ? (
          <p className="flex h-48 items-center justify-center text-sm text-brand-muted">
            Not enough data to compare
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={compareData} margin={CHART_MARGIN_LABELS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9 }}
                interval={0}
                angle={-28}
                textAnchor="end"
                height={56}
              />
              <YAxis tick={{ fontSize: 10 }} width={44} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="current" name={range.label} fill="#0a0a0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="previous" name={range.prevLabel} fill="#a1a1aa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {period === "year" && monthlyData.some((m) => m.spend > 0) && (
        <ChartCard title="Monthly trend" subtitle={`${new Date().getFullYear()} spend & rewards`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={44} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="spend" fill="#0a0a0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rewards" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Transaction list */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-brand-ink">Recent purchases</h3>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all logged purchases?")) clearHistory();
            }}
            className="text-xs font-medium text-brand-muted hover:text-red-600"
          >
            Clear all
          </button>
        </div>
        <ul className="divide-y divide-zinc-100">
          {records.slice(0, 25).map((r) => (
            <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-ink">{r.merchantName}</p>
                <p className="mt-0.5 break-words text-xs leading-relaxed text-brand-muted">
                  {new Date(r.timestamp).toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {categoryLabel(r.category)} · {shortCardName(r.selectedCardDisplayName)}
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                <div className="text-left sm:text-right">
                  <p className="font-semibold tabular-nums text-brand-ink">{money(r.amount)}</p>
                  <p className="text-xs tabular-nums text-emerald-700">
                    +{money(r.rewardCents / 100)} rewards
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRecord(r.id)}
                  className="rounded p-2 text-brand-muted hover:bg-zinc-100 hover:text-red-600"
                  aria-label="Remove purchase"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {prevSummary.count > 0 && (
        <p className="text-center text-xs text-brand-muted">
          {range.prevLabel}: {money(prevSummary.spend)} spent · {money(prevSummary.rewards)} rewards
        </p>
      )}
    </div>
  );
}
