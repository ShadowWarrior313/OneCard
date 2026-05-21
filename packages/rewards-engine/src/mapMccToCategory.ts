import type { RewardCategory } from "@onecard/shared-types";

/**
 * Maps ISO 18245 MCC to normalized RewardCategory.
 * Full MCC table will ship as curated JSON; this stub handles common ranges.
 */
export function mapMccToCategory(mcc: string): RewardCategory {
  const code = parseInt(mcc, 10);
  if (Number.isNaN(code)) return "other";

  // Grocery / supermarkets (5411, 5422, 5441, 5451, 5462)
  if (code >= 5411 && code <= 5499) return "groceries";
  // Restaurants / dining (5812–5814)
  if (code >= 5812 && code <= 5814) return "dining";
  // Gas stations (5541–5542, 5983)
  if (code === 5541 || code === 5542 || code === 5983) return "gas";
  // Airlines, hotels, car rental (3000–3999, 7011, 7512)
  if ((code >= 3000 && code <= 3999) || code === 7011 || code === 7512)
    return "travel";
  // Streaming / digital goods (4899, 5815, 5816, 5817, 5818)
  if ([4899, 5815, 5816, 5817, 5818].includes(code)) return "streaming";

  return "other";
}
