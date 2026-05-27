"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, BarChart3, Trash2 } from "lucide-react";
import { useSpend } from "@/context/SpendContext";
import {
  aggregateByCard,
  aggregateByCategory,
  spendBucketLabel,
  filterRecordsInRange,
  getPeriodRange,
  monthlyBuckets,
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

const CHART_MARGIN_TOP = 40;
const CHART_MARGIN_RIGHT = 12;
const CHART_MARGIN_LEFT = 4;
const BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0];
const MAX_BAR_SIZE = 52;
const TICK_CHAR_WIDTH = 6.2;
const TICK_LINE_HEIGHT = 13;
const VISIBLE_BARS_PHONE = 4;
const VISIBLE_BARS_PAGE = 5;

function visibleBarLimit(variant: "page" | "phone"): number {
  return variant === "phone" ? VISIBLE_BARS_PHONE : VISIBLE_BARS_PAGE;
}

type ChartLayout = {
  xAxisHeight: number;
  maxLineChars: number;
  bottomMargin: number;
  scrollable: boolean;
  minWidth?: number;
  slotWidth: number;
};

type HoverBarId = { index: number; dataKey: string };

type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  index?: number;
  value?: number | string;
  dataKey?: string;
};

function wrapChartLabel(text: string, maxCharsPerLine: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (word.length > maxCharsPerLine) {
      for (let i = 0; i < word.length; i += maxCharsPerLine) {
        lines.push(word.slice(i, i + maxCharsPerLine));
      }
      current = "";
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function getChartLayout(labels: string[], variant: "page" | "phone"): ChartLayout {
  const slotWidth = variant === "phone" ? 70 : 90;
  const chartWidth = variant === "phone" ? 280 : 520;
  const visibleBars = visibleBarLimit(variant);
  const scrollable = labels.length > visibleBars;
  const effectiveSlot = scrollable
    ? slotWidth
    : labels.length > 0
      ? (chartWidth - 48) / labels.length
      : chartWidth;
  const maxLineChars = Math.max(6, Math.floor((effectiveSlot - 8) / TICK_CHAR_WIDTH));

  const wrappedLabels = labels.map((label) => wrapChartLabel(label, maxLineChars));
  const maxLines = Math.max(1, ...wrappedLabels.map((lines) => lines.length));
  const sidePadding = variant === "phone" ? 64 : 72;

  return {
    xAxisHeight: 12 + maxLines * TICK_LINE_HEIGHT,
    maxLineChars,
    bottomMargin: 10 + maxLines * TICK_LINE_HEIGHT,
    scrollable,
    minWidth: scrollable ? labels.length * slotWidth + sidePadding : undefined,
    slotWidth: effectiveSlot,
  };
}

function roundedTopBarPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0 || w <= 0) return "";
  const cr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + cr} Q${x},${y} ${x + cr},${y} L${x + w - cr},${y} Q${x + w},${y} ${x + w},${y + cr} L${x + w},${y + h} Z`;
}

function fitLabelFontSize(text: string, maxWidth: number): number {
  const estimate = text.length * 7.2;
  if (estimate <= maxWidth) return 10;
  return Math.max(9, Math.floor((10 * maxWidth) / estimate));
}

function hoverLabelMaxWidth(barWidth: number, slotWidth: number): number {
  const expanded = barWidth + Math.min(barWidth * 0.85, 36);
  return Math.min(expanded, slotWidth * 0.94);
}

function RoundedBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill = "#0a0a0b",
  index = 0,
  dataKey = "",
  onHover,
}: BarShapeProps & {
  dataKey: string;
  onHover: (hovered: HoverBarId | null) => void;
}) {
  const barHeight = Math.max(0, height);

  return (
    <g
      onMouseEnter={() => onHover({ index, dataKey })}
      onMouseLeave={() => onHover(null)}
    >
      <path d={roundedTopBarPath(x, y, width, barHeight, BAR_RADIUS[0])} fill={fill} />
    </g>
  );
}

function HoverValueLabel({
  x,
  y,
  width,
  value,
  index,
  hovered,
  dataKey,
  slotWidth,
}: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: number | string;
  index?: number;
  hovered: HoverBarId | null;
  dataKey: string;
  slotWidth: number;
}) {
  if (index == null || hovered?.index !== index || hovered?.dataKey !== dataKey) return null;

  const barWidth = Number(width ?? 0);
  const barTop = Number(y ?? 0);
  if (barWidth <= 0) return null;

  const amount = money(Number(value ?? 0));
  const maxLabelW = hoverLabelMaxWidth(barWidth, slotWidth);
  const fontSize = fitLabelFontSize(amount, maxLabelW);

  return (
    <text
      x={Number(x) + barWidth / 2}
      y={barTop - 10}
      textAnchor="middle"
      dominantBaseline="auto"
      fill="#0a0a0b"
      fontSize={fontSize}
      fontWeight={700}
      pointerEvents="none"
    >
      {amount}
    </text>
  );
}

function WrappedChartTick({
  x,
  y,
  payload,
  maxLineChars,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  maxLineChars: number;
}) {
  if (x == null || y == null) return null;
  const lines = wrapChartLabel(String(payload?.value ?? ""), maxLineChars);
  return (
    <text fill="#71717a" fontSize={10} textAnchor="middle" x={x} y={y}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 10 : TICK_LINE_HEIGHT}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function yAxisMoney(v: number): string {
  return money(v);
}

function SpendChart({
  labels,
  variant,
  children,
}: {
  labels: string[];
  variant: "page" | "phone";
  children: (layout: ChartLayout) => ReactNode;
}) {
  const layout = useMemo(() => getChartLayout(labels, variant), [labels, variant]);
  return (
    <div
      className={`h-full w-full min-w-0 [&_.recharts-wrapper]:overflow-visible [&_.recharts-surface]:overflow-visible ${
        layout.scrollable ? "overflow-x-auto overflow-y-visible [scrollbar-width:thin]" : "overflow-visible"
      }`}
    >
      <div
        className="h-full"
        style={layout.minWidth ? { minWidth: layout.minWidth, width: layout.minWidth } : { width: "100%" }}
      >
        {children(layout)}
      </div>
    </div>
  );
}

function chartAxes(
  layout: ChartLayout,
  isPhone: boolean,
  tickProps: { dataKey?: string; interval?: number } = {},
) {
  return (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
      <XAxis
        dataKey="name"
        interval={0}
        tickLine={false}
        axisLine={{ stroke: "#e4e4e7" }}
        height={layout.xAxisHeight}
        tickMargin={4}
        tick={(props) => <WrappedChartTick {...props} maxLineChars={layout.maxLineChars} />}
        {...tickProps}
      />
      <YAxis
        tick={{ fontSize: 10, fill: "#71717a" }}
        width={isPhone ? 64 : 56}
        tickFormatter={yAxisMoney}
        tickLine={false}
        axisLine={false}
      />
    </>
  );
}

function MetricBarChart({
  data,
  dataKey,
  fill,
  labels,
  variant,
  isPhone,
}: {
  data: Array<{ name: string; spend: number; rewards: number }>;
  dataKey: ChartMetric;
  fill: string;
  labels: string[];
  variant: "page" | "phone";
  isPhone: boolean;
}) {
  const [hovered, setHovered] = useState<HoverBarId | null>(null);

  return (
    <SpendChart labels={labels} variant={variant}>
      {(layout) => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: CHART_MARGIN_TOP,
              right: CHART_MARGIN_RIGHT,
              left: CHART_MARGIN_LEFT,
              bottom: layout.bottomMargin,
            }}
            barCategoryGap="24%"
            barGap={4}
          >
            {chartAxes(layout, isPhone)}
            <Bar
              dataKey={dataKey}
              fill={fill}
              maxBarSize={MAX_BAR_SIZE}
              isAnimationActive={false}
              shape={(props: unknown) => (
                <RoundedBarShape
                  {...(props as BarShapeProps)}
                  dataKey={dataKey}
                  onHover={setHovered}
                />
              )}
            >
              <LabelList
                dataKey={dataKey}
                content={(props) => (
                  <HoverValueLabel
                    {...props}
                    hovered={hovered}
                    dataKey={dataKey}
                    slotWidth={layout.slotWidth}
                  />
                )}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </SpendChart>
  );
}

function GroupedBarChart({
  data,
  bars,
  labels,
  variant,
  isPhone,
  legend,
}: {
  data: Array<Record<string, string | number>>;
  bars: Array<{ dataKey: string; fill: string; name?: string }>;
  labels: string[];
  variant: "page" | "phone";
  isPhone: boolean;
  legend?: boolean;
}) {
  const [hovered, setHovered] = useState<HoverBarId | null>(null);

  return (
    <SpendChart labels={labels} variant={variant}>
      {(layout) => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: CHART_MARGIN_TOP,
              right: CHART_MARGIN_RIGHT,
              left: CHART_MARGIN_LEFT,
              bottom: layout.bottomMargin,
            }}
            barCategoryGap="22%"
            barGap={6}
          >
            {chartAxes(layout, isPhone)}
            {legend && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.fill}
                maxBarSize={MAX_BAR_SIZE}
                isAnimationActive={false}
                shape={(props: unknown) => (
                  <RoundedBarShape
                    {...(props as BarShapeProps)}
                    dataKey={bar.dataKey}
                    onHover={setHovered}
                  />
                )}
              >
                <LabelList
                  dataKey={bar.dataKey}
                  content={(props) => (
                    <HoverValueLabel
                      {...props}
                      hovered={hovered}
                      dataKey={bar.dataKey}
                      slotWidth={layout.slotWidth}
                    />
                  )}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </SpendChart>
  );
}

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
  compact = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-xl border border-zinc-200 bg-white ${compact ? "p-3" : "p-4 sm:p-5"}`}>
      <h3 className="break-words text-sm font-semibold leading-snug text-brand-ink">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 break-words text-xs leading-snug text-brand-muted">{subtitle}</p>
      )}
      <div className={`mt-4 w-full min-w-0 overflow-visible ${compact ? "h-48" : "h-52 sm:h-64"}`}>
        {children}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  periodLabel,
  compact = false,
}: {
  label: string;
  value: string;
  periodLabel: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-zinc-200 bg-white ${
        compact ? "px-3 py-3" : "px-4 py-4"
      }`}
    >
      <p
        className={`break-words font-semibold text-brand-muted ${
          compact ? "text-[0.65rem] leading-snug" : "text-xs uppercase tracking-wider"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 break-words font-bold tabular-nums text-brand-ink ${
          compact ? "text-base" : "text-lg sm:text-xl"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 break-words text-xs leading-snug text-brand-muted">{periodLabel}</p>
    </div>
  );
}

export function MySpendDashboard({ variant = "page" }: { variant?: "page" | "phone" }) {
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
        name: row.name,
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
            name: label,
            current: metric === "spend" ? (c?.spend ?? 0) : (c?.rewards ?? 0),
            previous: metric === "spend" ? (p?.spend ?? 0) : (p?.rewards ?? 0),
          };
        })
        .sort((a, b) => b.current - a.current);
    }

    const cur = aggregateByCategory(currentRecords);
    const prev = aggregateByCategory(previousRecords);
    const keys = new Set([...cur.map((c) => c.key), ...prev.map((p) => p.key)]);
    return [...keys]
      .map((key) => {
        const c = cur.find((x) => x.key === key);
        const p = prev.find((x) => x.key === key);
        const label = c?.label ?? p?.label ?? key;
        return {
          name: label,
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

  const isPhone = variant === "phone";

  return (
    <div className={`min-w-0 w-full max-w-full space-y-6 ${isPhone ? "space-y-4" : ""}`}>
      {/* Period + metric controls */}
      <div
        className={`flex min-w-0 flex-col gap-3 ${
          isPhone ? "" : "sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        }`}
      >
        <div
          className={`grid min-w-0 grid-cols-4 gap-1 rounded-lg border border-zinc-200 bg-white p-1 ${
            isPhone ? "" : "sm:flex sm:w-auto sm:flex-wrap"
          }`}
        >
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`min-h-[44px] min-w-0 rounded-md px-1.5 py-2 text-[0.65rem] font-semibold leading-tight transition sm:px-3 sm:py-1.5 sm:text-sm ${
                period === p.id ? "bg-brand-ink text-white" : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className={`min-w-0 ${isPhone ? "w-full" : "flex w-full sm:w-auto"}`}>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as ChartMetric)}
            className="min-h-[44px] w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-brand-ink sm:w-auto"
            aria-label="Chart metric"
          >
            <option value="spend">Dollars spent</option>
            <option value="rewards">Rewards earned</option>
          </select>
        </div>
      </div>

      {/* Summary — phone uses a fixed 2×2 grid (viewport breakpoints don't apply inside the demo frame) */}
      <div className={`grid min-w-0 gap-2 ${isPhone ? "grid-cols-2" : "gap-3 sm:grid-cols-2 lg:grid-cols-4"}`}>
        {[
          { label: "Total spent", value: money(summary.spend) },
          { label: "Rewards earned", value: money(summary.rewards) },
          { label: "Extra vs default", value: money(Math.max(0, summary.extra)) },
          { label: "Purchases", value: String(summary.count) },
        ].map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            periodLabel={range.label}
            compact={isPhone}
          />
        ))}
      </div>

      <div className={`grid gap-4 ${isPhone ? "" : "lg:grid-cols-2"}`}>
        <ChartCard title="Spend by card" subtitle={range.label} compact={isPhone}>
          {cardChartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-brand-muted">
              No spend this period
            </p>
          ) : (
            <MetricBarChart
              data={cardChartData}
              dataKey={metric}
              fill="#0a0a0b"
              labels={cardChartData.map((d) => d.name)}
              variant={variant}
              isPhone={isPhone}
            />
          )}
        </ChartCard>

        <ChartCard title="Spend by category" subtitle={range.label} compact={isPhone}>
          {categoryChartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-brand-muted">
              No spend this period
            </p>
          ) : (
            <MetricBarChart
              data={categoryChartData}
              dataKey={metric}
              fill="#0284c7"
              labels={categoryChartData.map((d) => d.name)}
              variant={variant}
              isPhone={isPhone}
            />
          )}
        </ChartCard>
      </div>

      {/* Period comparison */}
      <ChartCard
        title="Period comparison"
        subtitle={`${range.label} vs ${range.prevLabel}`}
        compact={isPhone}
      >
        <p className="mb-2 text-xs text-brand-muted sm:hidden">
          Comparing {metric === "spend" ? "spend" : "rewards"}
        </p>
        <div className={`mb-3 flex min-w-0 flex-wrap gap-2 ${isPhone ? "" : ""}`}>
          <button
            type="button"
            onClick={() => setCompareBy("category")}
            className={`min-h-[44px] shrink-0 rounded-md px-3 py-2 text-xs font-semibold sm:min-h-0 sm:px-2.5 sm:py-1 ${
              compareBy === "category" ? "bg-zinc-100 text-brand-ink" : "text-brand-muted"
            }`}
          >
            By category
          </button>
          <button
            type="button"
            onClick={() => setCompareBy("card")}
            className={`min-h-[44px] shrink-0 rounded-md px-3 py-2 text-xs font-semibold sm:min-h-0 sm:px-2.5 sm:py-1 ${
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
          <div className="h-[85%]">
            <GroupedBarChart
              data={compareData}
              labels={compareData.map((d) => d.name)}
              variant={variant}
              isPhone={isPhone}
              legend
              bars={[
                { dataKey: "current", fill: "#0a0a0b", name: range.label },
                { dataKey: "previous", fill: "#a1a1aa", name: range.prevLabel },
              ]}
            />
          </div>
        )}
      </ChartCard>

      {period === "year" && monthlyData.some((m) => m.spend > 0) && (
        <ChartCard title="Monthly trend" subtitle={`${new Date().getFullYear()} spend & rewards`} compact={isPhone}>
          <GroupedBarChart
            data={monthlyData}
            labels={monthlyData.map((d) => d.name)}
            variant={variant}
            isPhone={isPhone}
            legend
            bars={[
              { dataKey: "spend", fill: "#0a0a0b", name: "Spend" },
              { dataKey: "rewards", fill: "#059669", name: "Rewards" },
            ]}
          />
        </ChartCard>
      )}

      {/* Transaction list */}
      <div className="min-w-0 rounded-xl border border-zinc-200 bg-white">
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 sm:px-5">
          <h3 className="min-w-0 break-words text-sm font-semibold text-brand-ink">Recent purchases</h3>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all logged purchases?")) clearHistory();
            }}
            className="shrink-0 text-xs font-medium text-brand-muted hover:text-red-600"
          >
            Clear all
          </button>
        </div>
        <ul className="divide-y divide-zinc-100">
          {records.slice(0, 25).map((r) => (
            <li
              key={r.id}
              className={`min-w-0 px-4 py-3 sm:px-5 ${
                isPhone ? "space-y-2" : "flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
              }`}
            >
              <div className={`min-w-0 flex-1 ${isPhone ? "" : "overflow-x-auto"}`}>
                <p className={`font-semibold text-brand-ink ${isPhone ? "break-words" : "whitespace-nowrap"}`}>
                  {r.merchantName}
                </p>
                <p
                  className={`mt-0.5 text-xs leading-relaxed text-brand-muted ${
                    isPhone ? "break-words" : "whitespace-nowrap"
                  }`}
                >
                  {new Date(r.timestamp).toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {spendBucketLabel(r)} · {r.selectedCardDisplayName.replace(/\s+Card$/i, "")}
                </p>
              </div>
              <div
                className={`flex shrink-0 items-center gap-3 ${
                  isPhone ? "justify-between" : "justify-between sm:flex-col sm:items-end sm:justify-start"
                }`}
              >
                <div className={isPhone ? "text-left" : "text-left sm:text-right"}>
                  <p className="font-semibold tabular-nums text-brand-ink">{money(r.amount)}</p>
                  <p className="text-xs tabular-nums text-emerald-700">
                    +{money(r.rewardCents / 100)} rewards
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRecord(r.id)}
                  className="shrink-0 rounded p-2 text-brand-muted hover:bg-zinc-100 hover:text-red-600"
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
        <p className="break-words text-center text-xs leading-relaxed text-brand-muted">
          {range.prevLabel}: {money(prevSummary.spend)} spent · {money(prevSummary.rewards)} rewards
        </p>
      )}
    </div>
  );
}
