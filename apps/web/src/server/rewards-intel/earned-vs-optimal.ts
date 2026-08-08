import type { SafeHubTransaction, SafeLinkedAccount } from "@/data/schema";
import type { CardRewardCategoryKey, CategoryReward } from "@/data/cardRewards";
import { getCardRewardConfig } from "@/data/cardRewards";
import { normalizedRate, rewardForCategory } from "./rules-data";
import { resolveHubMerchantId } from "./resolveHubMerchant";

/**
 * Earned-vs-optimal — "rewards left on the table".
 *
 * For each transaction we compute what the actual card earned and what the best
 * card the user *already holds* would have earned, then the gap. Because the
 * reward category is PREDICTED (not the real network MCC), every number here is
 * an estimate and the UI must say so. Cap blending mirrors the live optimizer so
 * the "best card" doesn't recommend a maxed-out bonus.
 */
interface UsageState {
  [key: string]: number;
}

export interface RewardedTransaction {
  transaction: SafeHubTransaction;
  actualCardId?: string;
  optimalCardId?: string;
  earned: number;
  optimal: number;
  missed: number;
}

export interface RewardsCategoryBreakdown {
  category: CardRewardCategoryKey;
  spent: number;
  earned: number;
  missed: number;
}

export interface RewardsSummaryData {
  month: string;
  spent: number;
  earned: number;
  optimal: number;
  missed: number;
  estimatedTransactions: number;
  unmappedTransactions: number;
  categoryBreakdown: RewardsCategoryBreakdown[];
  topMissed: RewardedTransaction[];
}

function actualCardId(
  transaction: SafeHubTransaction,
  accounts: SafeLinkedAccount[],
): string | undefined {
  return (
    transaction.trackedCardId ??
    accounts.find((account) => account.id === transaction.accountId)?.trackedCardId
  );
}

function usageKey(
  cardId: string,
  category: CardRewardCategoryKey,
  reward: CategoryReward,
  date: string,
): string | undefined {
  if (!reward.cap?.period) return undefined;
  const bucket = reward.cap.sharedCapGroup ?? category;
  const period = reward.cap.period === "monthly" ? date.slice(0, 7) : date.slice(0, 4);
  return `${cardId}:${bucket}:${period}`;
}

function merchantIdFor(transaction: SafeHubTransaction): string | undefined {
  return (
    transaction.categorized.merchantId ??
    resolveHubMerchantId(transaction.merchantName, transaction.website)
  );
}

/** Category reward after merchant exclusions (e.g. Cobalt groceries at Loblaws). */
function rewardForTransactionCategory(
  cardId: string,
  category: CardRewardCategoryKey,
  merchantId: string | undefined,
): CategoryReward | undefined {
  const reward = rewardForCategory(cardId, category);
  if (
    merchantId &&
    reward?.excludedMerchantIds?.length &&
    reward.excludedMerchantIds.includes(merchantId)
  ) {
    return rewardForCategory(cardId, "other");
  }
  return reward;
}

function effectiveRate(
  cardId: string,
  category: CardRewardCategoryKey,
  amount: number,
  date: string,
  usage: UsageState,
  merchantId: string | undefined,
): number {
  const reward = rewardForTransactionCategory(cardId, category, merchantId);
  const config = getCardRewardConfig(cardId);
  if (!reward || !config) return 0;
  const excluded =
    merchantId &&
    rewardForCategory(cardId, category)?.excludedMerchantIds?.includes(merchantId);
  const bonusRate = excluded
    ? normalizedRate(cardId, "other")
    : normalizedRate(cardId, category);
  const baseRate = normalizedRate(cardId, "other");
  const key = usageKey(cardId, category, reward, date);
  if (!key || !reward.cap || excluded) return bonusRate;
  const remaining = Math.max(0, reward.cap.maxSpend - (usage[key] ?? 0));
  if (remaining <= 0) return baseRate;
  if (amount <= remaining) return bonusRate;
  return (remaining * bonusRate + (amount - remaining) * baseRate) / amount;
}

function expectedReward(
  transaction: SafeHubTransaction,
  cardId: string,
  usage: UsageState,
): number {
  const merchantId = merchantIdFor(transaction);
  return transaction.categorized.candidates.reduce(
    (sum, candidate) =>
      sum +
      transaction.amount *
        candidate.probability *
        effectiveRate(
          cardId,
          candidate.category,
          transaction.amount,
          transaction.date,
          usage,
          merchantId,
        ),
    0,
  );
}

function applyUsage(transaction: SafeHubTransaction, cardId: string, usage: UsageState): void {
  const merchantId = merchantIdFor(transaction);
  for (const candidate of transaction.categorized.candidates) {
    const reward = rewardForTransactionCategory(cardId, candidate.category, merchantId);
    if (!reward?.cap?.period) continue;
    // Excluded merchants earn at base — do not consume the bonus cap.
    if (
      merchantId &&
      rewardForCategory(cardId, candidate.category)?.excludedMerchantIds?.includes(merchantId)
    ) {
      continue;
    }
    const key = usageKey(cardId, candidate.category, reward, transaction.date);
    if (key) usage[key] = (usage[key] ?? 0) + transaction.amount * candidate.probability;
  }
}

function bestHeldCard(
  transaction: SafeHubTransaction,
  walletCardIds: string[],
  usage: UsageState,
): { cardId?: string; reward: number } {
  return walletCardIds.reduce(
    (best, cardId) => {
      const reward = expectedReward(transaction, cardId, usage);
      return reward > best.reward ? { cardId, reward } : best;
    },
    { cardId: undefined, reward: 0 } as { cardId?: string; reward: number },
  );
}

function moneyRound(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeRewardsSummary(input: {
  transactions: SafeHubTransaction[];
  accounts: SafeLinkedAccount[];
  walletCardIds: string[];
  month?: string;
}): RewardsSummaryData {
  const month = input.month ?? new Date().toISOString().slice(0, 7);
  const usage: UsageState = {};
  const rewarded: RewardedTransaction[] = [];
  const categories = new Map<CardRewardCategoryKey, RewardsCategoryBreakdown>();

  const spendTransactions = input.transactions
    .filter((transaction) => !transaction.pending && transaction.amount > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  for (const transaction of spendTransactions) {
    const cardId = actualCardId(transaction, input.accounts);
    const earned = cardId ? expectedReward(transaction, cardId, usage) : 0;
    const best = bestHeldCard(transaction, input.walletCardIds, usage);
    const optimal = cardId ? Math.max(earned, best.reward) : 0;
    const missed = Math.max(0, optimal - earned);
    if (transaction.date.startsWith(month)) {
      rewarded.push({
        transaction,
        actualCardId: cardId,
        optimalCardId: best.cardId,
        earned,
        optimal,
        missed,
      });
      const category = transaction.categorized.category;
      const row = categories.get(category) ?? { category, spent: 0, earned: 0, missed: 0 };
      row.spent += transaction.amount;
      row.earned += earned;
      row.missed += missed;
      categories.set(category, row);
    }
    if (cardId) applyUsage(transaction, cardId, usage);
  }

  return {
    month,
    spent: moneyRound(rewarded.reduce((sum, row) => sum + row.transaction.amount, 0)),
    earned: moneyRound(rewarded.reduce((sum, row) => sum + row.earned, 0)),
    optimal: moneyRound(rewarded.reduce((sum, row) => sum + row.optimal, 0)),
    missed: moneyRound(rewarded.reduce((sum, row) => sum + row.missed, 0)),
    estimatedTransactions: rewarded.length,
    unmappedTransactions: rewarded.filter((row) => !row.actualCardId).length,
    categoryBreakdown: [...categories.values()]
      .map((row) => ({
        ...row,
        spent: moneyRound(row.spent),
        earned: moneyRound(row.earned),
        missed: moneyRound(row.missed),
      }))
      .sort((a, b) => b.missed - a.missed || b.spent - a.spent),
    topMissed: rewarded
      .filter((row) => row.missed > 0.005)
      .sort((a, b) => b.missed - a.missed)
      .slice(0, 5),
  };
}
