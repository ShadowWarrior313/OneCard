import type { RewardCategory } from "@onecard/shared-types";

export interface MerchantPreset {
  id: string;
  name: string;
  mcc: string;
  category: RewardCategory;
  icon: string;
  group: "Groceries" | "Food & drink" | "Travel" | "Entertainment" | "Gas" | "Shopping" | "Subscriptions";
}

export const MERCHANT_PRESETS: MerchantPreset[] = [
  { id: "loblaws", name: "Loblaws", mcc: "5411", category: "groceries", icon: "🛒", group: "Groceries" },
  { id: "metro", name: "Metro", mcc: "5411", category: "groceries", icon: "🛒", group: "Groceries" },
  { id: "costco", name: "Costco", mcc: "5300", category: "groceries", icon: "📦", group: "Groceries" },
  { id: "air_canada", name: "Air Canada", mcc: "3000", category: "travel", icon: "✈️", group: "Travel" },
  { id: "westjet", name: "WestJet", mcc: "3000", category: "travel", icon: "✈️", group: "Travel" },
  { id: "marriott", name: "Marriott Hotel", mcc: "7011", category: "travel", icon: "🏨", group: "Travel" },
  { id: "uber_eats", name: "Uber Eats", mcc: "5812", category: "dining", icon: "🍽️", group: "Food & drink" },
  { id: "tim_hortons", name: "Tim Hortons", mcc: "5814", category: "dining", icon: "☕", group: "Food & drink" },
  { id: "cineplex", name: "Cineplex", mcc: "7832", category: "other", icon: "🎬", group: "Entertainment" },
  { id: "spotify", name: "Spotify", mcc: "5815", category: "streaming", icon: "🎵", group: "Subscriptions" },
  { id: "netflix", name: "Netflix", mcc: "5815", category: "streaming", icon: "📺", group: "Subscriptions" },
  { id: "shell", name: "Shell", mcc: "5541", category: "gas", icon: "⛽", group: "Gas" },
  { id: "petro_canada", name: "Petro-Canada", mcc: "5541", category: "gas", icon: "⛽", group: "Gas" },
  { id: "amazon", name: "Amazon.ca", mcc: "5399", category: "other", icon: "📦", group: "Shopping" },
  { id: "rogers", name: "Rogers (bill pay)", mcc: "4814", category: "recurring_bills", icon: "📱", group: "Subscriptions" },
];

export const MERCHANT_GROUPS = [
  "Groceries",
  "Food & drink",
  "Travel",
  "Entertainment",
  "Gas",
  "Shopping",
  "Subscriptions",
] as const;
