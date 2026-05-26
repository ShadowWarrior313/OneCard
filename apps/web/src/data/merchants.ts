import type { RewardCategory } from "@onecard/shared-types";

export type MerchantGroup =
  | "Groceries"
  | "Food & drink"
  | "Travel"
  | "Entertainment"
  | "Gas"
  | "Shopping"
  | "Subscriptions";

export type MerchantKind = "brand" | "sector";

export interface MerchantPreset {
  id: string;
  name: string;
  shortName?: string;
  mcc: string;
  category: RewardCategory;
  kind: MerchantKind;
  /** Brandfetch domain(s) — first match wins */
  logoDomain?: string;
  logoDomainFallbacks?: string[];
  group: MerchantGroup;
}

export const MERCHANT_GROUPS: MerchantGroup[] = [
  "Groceries",
  "Food & drink",
  "Travel",
  "Entertainment",
  "Gas",
  "Shopping",
  "Subscriptions",
];

export const MERCHANT_PRESETS: MerchantPreset[] = [
  {
    id: "sector_groceries",
    name: "Any grocery",
    mcc: "5411",
    category: "groceries",
    kind: "sector",
    group: "Groceries",
  },
  {
    id: "loblaws",
    name: "Loblaws",
    shortName: "Loblaws",
    mcc: "5411",
    category: "groceries",
    kind: "brand",
    logoDomain: "loblaws.ca",
    group: "Groceries",
  },
  {
    id: "metro",
    name: "Metro",
    mcc: "5411",
    category: "groceries",
    kind: "brand",
    logoDomain: "metro.ca",
    group: "Groceries",
  },
  {
    id: "costco",
    name: "Costco",
    mcc: "5300",
    category: "groceries",
    kind: "brand",
    logoDomain: "costco.ca",
    group: "Groceries",
  },
  {
    id: "sector_dining",
    name: "Any restaurant",
    mcc: "5812",
    category: "dining",
    kind: "sector",
    group: "Food & drink",
  },
  {
    id: "uber_eats",
    name: "Uber Eats",
    shortName: "Uber Eats",
    mcc: "5812",
    category: "dining",
    kind: "brand",
    logoDomain: "ubereats.com",
    group: "Food & drink",
  },
  {
    id: "tim_hortons",
    name: "Tim Hortons",
    shortName: "Tims",
    mcc: "5814",
    category: "dining",
    kind: "brand",
    logoDomain: "timhortons.com",
    logoDomainFallbacks: ["timhortons.ca"],
    group: "Food & drink",
  },
  {
    id: "sector_travel",
    name: "Any travel",
    mcc: "3000",
    category: "travel",
    kind: "sector",
    group: "Travel",
  },
  {
    id: "air_canada",
    name: "Air Canada",
    shortName: "Air Canada",
    mcc: "3000",
    category: "travel",
    kind: "brand",
    logoDomain: "aircanada.com",
    group: "Travel",
  },
  {
    id: "westjet",
    name: "WestJet",
    mcc: "3000",
    category: "travel",
    kind: "brand",
    logoDomain: "westjet.com",
    group: "Travel",
  },
  {
    id: "marriott",
    name: "Marriott",
    mcc: "7011",
    category: "travel",
    kind: "brand",
    logoDomain: "marriott.com",
    group: "Travel",
  },
  {
    id: "sector_entertainment",
    name: "Any entertainment",
    mcc: "7832",
    category: "other",
    kind: "sector",
    group: "Entertainment",
  },
  {
    id: "cineplex",
    name: "Cineplex",
    mcc: "7832",
    category: "other",
    kind: "brand",
    logoDomain: "cineplex.com",
    group: "Entertainment",
  },
  {
    id: "sector_gas",
    name: "Any gas station",
    mcc: "5541",
    category: "gas",
    kind: "sector",
    group: "Gas",
  },
  {
    id: "shell",
    name: "Shell",
    mcc: "5541",
    category: "gas",
    kind: "brand",
    logoDomain: "shell.com",
    logoDomainFallbacks: ["shell.ca"],
    group: "Gas",
  },
  {
    id: "petro_canada",
    name: "Petro-Canada",
    shortName: "Petro-Can",
    mcc: "5541",
    category: "gas",
    kind: "brand",
    logoDomain: "petro-canada.ca",
    group: "Gas",
  },
  {
    id: "sector_shopping",
    name: "General retail",
    mcc: "5399",
    category: "other",
    kind: "sector",
    group: "Shopping",
  },
  {
    id: "amazon",
    name: "Amazon.ca",
    shortName: "Amazon",
    mcc: "5399",
    category: "other",
    kind: "brand",
    logoDomain: "amazon.ca",
    group: "Shopping",
  },
  {
    id: "sector_subscriptions",
    name: "Any subscription",
    mcc: "5815",
    category: "streaming",
    kind: "sector",
    group: "Subscriptions",
  },
  {
    id: "spotify",
    name: "Spotify",
    mcc: "5815",
    category: "streaming",
    kind: "brand",
    logoDomain: "spotify.com",
    group: "Subscriptions",
  },
  {
    id: "netflix",
    name: "Netflix",
    mcc: "5815",
    category: "streaming",
    kind: "brand",
    logoDomain: "netflix.com",
    group: "Subscriptions",
  },
  {
    id: "rogers",
    name: "Rogers",
    shortName: "Rogers",
    mcc: "4814",
    category: "recurring_bills",
    kind: "brand",
    logoDomain: "rogers.com",
    group: "Subscriptions",
  },
];

export function merchantsInGroup(group: MerchantGroup) {
  return MERCHANT_PRESETS.filter((m) => m.group === group);
}
