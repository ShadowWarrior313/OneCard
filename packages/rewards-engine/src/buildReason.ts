import type { RewardEstimate } from "./estimateReward.js";

export function buildWinnerReason(
  winner: RewardEstimate,
  nextBest: RewardEstimate | undefined,
  merchantName: string,
): string {
  const value = (winner.estimatedRewardValueCents / 100).toFixed(2);
  let msg = `Charged to ${winner.displayName}: ${winner.multiplier}x on ${winner.category} at ${merchantName}, worth ~$${value}`;

  if (nextBest) {
    const nextValue = (nextBest.estimatedRewardValueCents / 100).toFixed(2);
    const delta =
      (winner.estimatedRewardValueCents - nextBest.estimatedRewardValueCents) /
      100;
    msg += ` vs $${nextValue} on your next-best card (${nextBest.displayName})`;
    if (delta > 0) {
      msg += ` — +$${delta.toFixed(2)} on this purchase`;
    }
  }

  return msg;
}
