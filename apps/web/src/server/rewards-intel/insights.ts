import type {
  SafeHubTransaction,
  SafeLinkedAccount,
  SafeSubTrackerRecord,
} from "@/data/schema";
import type { CardRewardCategoryKey } from "@/data/cardRewards";
import { getCardRewardConfig } from "@/data/cardRewards";
import { CREDIT_RULES, ROTATION_RULES, curatedCardIds, normalizedRate } from "./rules-data";

/**
 * Rewards-intelligence insights — the consumer decision layer.
 *
 * Consolidates the signals a cardholder actually wants and that Plaid will never
 * compute: bonus-cap projections, unused statement credits, rotating-category
 * reminders, annual-fee ROI, the next-card expected uplift, and sign-up-bonus
 * (SUB) minimum-spend progress. Every figure is an ESTIMATE built on a PREDICTED
 * category; alerts say so and defer dynamic terms to the issuer.
 */

// ── Caps / credits / rotations / fee ROI ─────────────────────────────────────

export interface TrackerAlert {
  id: string;
  kind: "cap" | "credit" | "rotation" | "fee";
  cardId: string;
  title: string;
  detail: string;
  severity: "info" | "warning";
}

export interface CapProgress {
  id: string;
  cardId: string;
  label: string;
  used: number;
  limit: number;
  percent: number;
  projectedHitDate?: string;
}

export interface TrackerData {
  caps: CapProgress[];
  alerts: TrackerAlert[];
}

function quarterEnd(date: Date): string {
  const endMonth = Math.floor(date.getMonth() / 3) * 3 + 3;
  return new Date(date.getFullYear(), endMonth, 0).toISOString().slice(0, 10);
}

function trackedCardFor(
  transaction: SafeHubTransaction,
  accounts: SafeLinkedAccount[],
): string | undefined {
  return (
    transaction.trackedCardId ??
    accounts.find((account) => account.id === transaction.accountId)?.trackedCardId
  );
}

function projectedHitDate(
  used: number,
  limit: number,
  period: "monthly" | "annual",
): string | undefined {
  if (used <= 0 || used >= limit) return undefined;
  const now = new Date();
  const elapsed =
    period === "monthly"
      ? Math.max(1, now.getDate())
      : Math.max(
          1,
          Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000),
        );
  const daily = used / elapsed;
  if (daily <= 0) return undefined;
  const hit = new Date(now.getTime() + ((limit - used) / daily) * 86_400_000);
  return hit.toISOString().slice(0, 10);
}

export function computeTrackers(input: {
  transactions: SafeHubTransaction[];
  accounts: SafeLinkedAccount[];
  walletCardIds: string[];
}): TrackerData {
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const year = String(now.getFullYear());
  const caps = new Map<string, CapProgress & { period: "monthly" | "annual" }>();
  const alerts: TrackerAlert[] = [];

  for (const cardId of input.walletCardIds) {
    const config = getCardRewardConfig(cardId);
    if (!config) continue;
    for (const [category, reward] of Object.entries(config.categories)) {
      if (!reward?.cap?.period) continue;
      const bucket = reward.cap.sharedCapGroup ?? category;
      const id = `${cardId}:${bucket}:${reward.cap.period}`;
      if (!caps.has(id)) {
        caps.set(id, {
          id,
          cardId,
          label: `${config.name} · ${bucket.replaceAll("_", " ")}`,
          used: 0,
          limit: reward.cap.maxSpend,
          percent: 0,
          period: reward.cap.period,
        });
      }
    }
  }

  for (const transaction of input.transactions) {
    if (transaction.pending || transaction.amount <= 0) continue;
    const cardId = trackedCardFor(transaction, input.accounts);
    if (!cardId) continue;
    const config = getCardRewardConfig(cardId);
    const reward =
      config?.categories[transaction.categorized.category] ?? config?.categories.other;
    if (!reward?.cap?.period) continue;
    const inPeriod =
      reward.cap.period === "monthly"
        ? transaction.date.startsWith(month)
        : transaction.date.startsWith(year);
    if (!inPeriod) continue;
    const id = `${cardId}:${reward.cap.sharedCapGroup ?? transaction.categorized.category}:${reward.cap.period}`;
    const tracker = caps.get(id);
    if (tracker) tracker.used += transaction.amount;
  }

  const capRows = [...caps.values()].map((tracker) => {
    const percent = Math.min(100, Math.round((tracker.used / tracker.limit) * 100));
    const result: CapProgress = {
      ...tracker,
      used: Math.round(tracker.used * 100) / 100,
      percent,
      projectedHitDate: projectedHitDate(tracker.used, tracker.limit, tracker.period),
    };
    if (percent >= 80) {
      alerts.push({
        id: `alert:${tracker.id}`,
        kind: "cap",
        cardId: tracker.cardId,
        title: percent >= 100 ? "Bonus cap reached" : "Bonus cap is nearly maxed",
        detail: `${tracker.label}: ${percent}% used. Review which card to use next.`,
        severity: "warning",
      });
    }
    return result;
  });

  for (const credit of CREDIT_RULES.filter((rule) => input.walletCardIds.includes(rule.cardId))) {
    const used = input.transactions
      .filter(
        (transaction) =>
          !transaction.pending && transaction.amount > 0 && transaction.date.startsWith(year),
      )
      .filter((transaction) => trackedCardFor(transaction, input.accounts) === credit.cardId)
      .filter((transaction) => transaction.categorized.category === credit.category)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const remaining = Math.max(0, credit.amount - used);
    if (remaining > 0) {
      alerts.push({
        id: `credit:${credit.id}`,
        kind: "credit",
        cardId: credit.cardId,
        title: `${credit.label}: $${remaining.toFixed(0)} may remain`,
        detail: "Estimate only. Confirm eligibility and statement history with your issuer.",
        severity: "info",
      });
    }
  }

  for (const rotation of ROTATION_RULES.filter((rule) =>
    input.walletCardIds.includes(rule.cardId),
  )) {
    alerts.push({
      id: `rotation:${rotation.id}`,
      kind: "rotation",
      cardId: rotation.cardId,
      title: rotation.label,
      detail: `The current quarter ends ${quarterEnd(now)}. Confirm the active category in your issuer portal.`,
      severity: "info",
    });
  }

  for (const cardId of input.walletCardIds) {
    const config = getCardRewardConfig(cardId);
    if (!config?.annualFee) continue;
    const spend = input.transactions
      .filter(
        (transaction) =>
          !transaction.pending && transaction.amount > 0 && transaction.date.startsWith(year),
      )
      .filter((transaction) => trackedCardFor(transaction, input.accounts) === cardId);
    if (spend.length === 0) continue;
    const estimatedEarned = spend.reduce(
      (sum, transaction) =>
        sum + transaction.amount * normalizedRate(cardId, transaction.categorized.category),
      0,
    );
    const elapsedYear = Math.max(
      1,
      Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000),
    );
    if (estimatedEarned * (365 / elapsedYear) < config.annualFee) {
      alerts.push({
        id: `fee:${cardId}`,
        kind: "fee",
        cardId,
        title: "Annual fee ROI needs review",
        detail: `${config.name}: rewards are running below the $${config.annualFee.toFixed(0)} annual fee. Renewal date is not stored yet; confirm timing with your issuer.`,
        severity: "warning",
      });
    }
  }

  return { caps: capRows.sort((a, b) => b.percent - a.percent).slice(0, 8), alerts };
}

// ── Next-card expected uplift ────────────────────────────────────────────────

export interface AdvisorRecommendation {
  cardId: string;
  name: string;
  issuer: string;
  annualUplift: number;
  annualFee: number;
  topCategory: CardRewardCategoryKey;
  topCategorySpend: number;
  assumptions: string[];
}

export function recommendNextCard(input: {
  transactions: SafeHubTransaction[];
  walletCardIds: string[];
}): AdvisorRecommendation | undefined {
  const spend = new Map<CardRewardCategoryKey, number>();
  const eligible = input.transactions.filter(
    (transaction) => !transaction.pending && transaction.amount > 0,
  );
  for (const transaction of eligible) {
    spend.set(
      transaction.categorized.category,
      (spend.get(transaction.categorized.category) ?? 0) + transaction.amount,
    );
  }
  if (spend.size === 0) return undefined;

  const dates = eligible.map((transaction) => transaction.date).sort();
  const observedDays = Math.max(
    30,
    Math.ceil(
      (new Date(`${dates.at(-1)}T12:00:00`).getTime() -
        new Date(`${dates[0]}T12:00:00`).getTime()) /
        86_400_000,
    ) + 1,
  );
  const annualizer = 365 / observedDays;

  const heldBestRate = (category: CardRewardCategoryKey) =>
    Math.max(0, ...input.walletCardIds.map((cardId) => normalizedRate(cardId, category)));

  return curatedCardIds()
    .filter((cardId) => !input.walletCardIds.includes(cardId))
    .map((cardId) => {
      const config = getCardRewardConfig(cardId)!;
      const categoryRows = [...spend.entries()].map(([category, observedSpend]) => {
        const annualSpend = observedSpend * annualizer;
        return {
          category,
          annualSpend,
          uplift:
            annualSpend * Math.max(0, normalizedRate(cardId, category) - heldBestRate(category)),
        };
      });
      const annualFee = config.annualFee ?? 0;
      const top = categoryRows.sort((a, b) => b.uplift - a.uplift)[0]!;
      return {
        cardId,
        name: config.name,
        issuer: config.issuer,
        annualUplift:
          Math.round((categoryRows.reduce((sum, row) => sum + row.uplift, 0) - annualFee) * 100) /
          100,
        annualFee,
        topCategory: top.category,
        topCategorySpend: Math.round(top.annualSpend),
        assumptions: [
          `Annualized from ${observedDays} days of categorized spend.`,
          `Net of the $${annualFee.toFixed(0)} annual fee.`,
          config.needsVerification
            ? `Terms flagged for issuer verification (${config.ratesAsOf}).`
            : `Curated terms as of ${config.ratesAsOf}.`,
        ],
      };
    })
    .filter((candidate) => candidate.annualUplift > 0)
    .sort((a, b) => b.annualUplift - a.annualUplift)[0];
}

// ── Sign-up-bonus (SUB) minimum-spend progress ───────────────────────────────

export interface SubProgress {
  id: string;
  cardId: string;
  cardName: string;
  minimumSpend: number;
  spent: number;
  remaining: number;
  deadline: string;
  status: "complete" | "on_track" | "behind";
}

export function computeSubProgress(
  trackers: SafeSubTrackerRecord[],
  transactions: SafeHubTransaction[],
  accounts: SafeLinkedAccount[],
): SubProgress[] {
  const today = new Date().toISOString().slice(0, 10);
  return trackers.map((tracker) => {
    const spent = transactions
      .filter((transaction) => !transaction.pending && transaction.amount > 0)
      .filter(
        (transaction) =>
          transaction.date >= tracker.startedAt && transaction.date <= tracker.deadline,
      )
      .filter((transaction) => trackedCardFor(transaction, accounts) === tracker.cardId)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const minimumSpend = tracker.minimumSpend;
    const elapsed = Math.max(
      1,
      new Date(today).getTime() - new Date(tracker.startedAt).getTime(),
    );
    const duration = Math.max(
      1,
      new Date(tracker.deadline).getTime() - new Date(tracker.startedAt).getTime(),
    );
    const expected = minimumSpend * Math.min(1, elapsed / duration);
    return {
      id: tracker.id,
      cardId: tracker.cardId,
      cardName: getCardRewardConfig(tracker.cardId)?.name ?? tracker.cardId,
      minimumSpend,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.max(0, Math.round((minimumSpend - spent) * 100) / 100),
      deadline: tracker.deadline,
      status:
        spent >= minimumSpend ? "complete" : spent >= expected ? "on_track" : "behind",
    };
  });
}

// ── One-call aggregator ──────────────────────────────────────────────────────

export interface InsightsData {
  trackers: TrackerData;
  recommendation?: AdvisorRecommendation;
  subProgress: SubProgress[];
}

/** Compute the full insights payload for the internal hub API. */
export function computeInsights(input: {
  transactions: SafeHubTransaction[];
  accounts: SafeLinkedAccount[];
  subTrackers: SafeSubTrackerRecord[];
  walletCardIds: string[];
}): InsightsData {
  return {
    trackers: computeTrackers({
      transactions: input.transactions,
      accounts: input.accounts,
      walletCardIds: input.walletCardIds,
    }),
    recommendation: recommendNextCard({
      transactions: input.transactions,
      walletCardIds: input.walletCardIds,
    }),
    subProgress: computeSubProgress(input.subTrackers, input.transactions, input.accounts),
  };
}
