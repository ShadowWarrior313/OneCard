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
  // Telecom / utilities / recurring (4814, 4900)
  if (code === 4814 || code === 4900) return "recurring_bills";
  // Travel agencies & OTAs (4722)
  if (code === 4722) return "travel";
  // Drug stores / pharmacies (5912)
  if (code === 5912) return "drugstore";
  // Entertainment — cinemas, recreation (7832, 7922, 7996)
  if ([7832, 7922, 7996].includes(code)) return "entertainment";
  // Public transit / transportation (4111, 4112, 4131)
  if ([4111, 4112, 4131].includes(code)) return "transportation";
  // Rideshare / taxi (4121)
  if (code === 4121) return "transportation";
  // Electronics — computer/electronics stores and parts (5045, 5065, 5732, 5734)
  if ([5045, 5065, 5732, 5734].includes(code)) return "electronics";
  // Retail — department/discount/general merchandise stores (5300, 5310, 5311, 5399, 5942, 5945)
  if ([5300, 5310, 5311, 5399, 5942, 5945].includes(code)) return "retail";
  // Adventure — sporting goods and bicycle shops (5940, 5941)
  if (code === 5940 || code === 5941) return "adventure";
  // Clothing — apparel, footwear, accessories (5611–5699)
  if (code >= 5611 && code <= 5699) return "clothing";
  // Home improvement — hardware, building materials, furniture (5200, 5211, 5251, 5712, 5719, 5722)
  if ([5200, 5211, 5251, 5712, 5719, 5722].includes(code)) return "home_improvement";
  // Fitness — sports clubs, gyms (7997)
  if (code === 7997) return "fitness";
  // Beauty — salons, spas, barbers (7230, 7298)
  if (code === 7230 || code === 7298) return "beauty";
  // Education — schools, colleges, vocational (8220, 8249, 8299)
  if ([8220, 8249, 8299].includes(code)) return "education";
  // Pets — pet shops and veterinarians (742, 5995)
  if (code === 742 || code === 5995) return "pets";

  return "other";
}
