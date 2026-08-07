import type { RewardCategory } from "@onecard/shared-types";
import { MERCHANT_BRAND_DEFS } from "./merchantBrands";
import {
  MERCHANT_AVAILABILITY,
  merchantAvailableAt,
  type MerchantAvailability,
  type MerchantLocation,
} from "./merchantAvailability";

export type MerchantGroup =
  | "Groceries"
  | "Food & drink"
  | "Travel"
  | "Entertainment"
  | "Gas"
  | "Shopping"
  | "Subscriptions"
  | "Health & pharmacy"
  | "Transportation"
  | "Education"
  | "Home & utilities"
  | "Other";

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
  searchAliases?: string[];
  availability?: MerchantAvailability;
  group: MerchantGroup;
}

const SECTOR_PRESETS: MerchantPreset[] = [
  {
    id: "sector_groceries",
    name: "Any grocery",
    mcc: "5411",
    category: "groceries",
    kind: "sector",
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
    id: "sector_travel",
    name: "Any travel",
    mcc: "3000",
    category: "travel",
    kind: "sector",
    group: "Travel",
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
    id: "sector_shopping",
    name: "General retail",
    mcc: "5399",
    category: "other",
    kind: "sector",
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
    id: "sector_entertainment",
    name: "Any entertainment",
    mcc: "7832",
    category: "entertainment",
    kind: "sector",
    group: "Entertainment",
  },
  {
    id: "sector_health",
    name: "Any pharmacy / health",
    shortName: "Any health",
    mcc: "5912",
    category: "drugstore",
    kind: "sector",
    group: "Health & pharmacy",
  },
  {
    id: "sector_transport",
    name: "Any transit / rideshare",
    shortName: "Any transit",
    mcc: "4111",
    category: "transportation",
    kind: "sector",
    group: "Transportation",
  },
  {
    id: "sector_education",
    name: "Any education",
    mcc: "8220",
    category: "education",
    kind: "sector",
    group: "Education",
  },
  {
    id: "sector_utilities",
    name: "Any utility bill",
    shortName: "Any utility",
    mcc: "4900",
    category: "recurring_bills",
    kind: "sector",
    group: "Home & utilities",
  },
  {
    id: "sector_other",
    name: "Any other purchase",
    shortName: "Any other",
    mcc: "5999",
    category: "other",
    kind: "sector",
    group: "Other",
  },
];

const BRAND_PRESETS: MerchantPreset[] = MERCHANT_BRAND_DEFS.map((brand) => ({
  id: brand.id,
  name: brand.name,
  shortName: brand.shortName,
  mcc: brand.mcc,
  category: brand.category,
  kind: "brand" as const,
  logoDomain: brand.logoDomain,
  logoDomainFallbacks: brand.logoDomainFallbacks,
  searchAliases: brand.searchAliases,
  availability: brand.availability ?? MERCHANT_AVAILABILITY[brand.id],
  group: brand.group,
}));

export const MERCHANT_PRESETS: MerchantPreset[] = [
  ...SECTOR_PRESETS,
  ...BRAND_PRESETS,
];

export const MERCHANT_GROUPS: MerchantGroup[] = [
  "Groceries",
  "Food & drink",
  "Travel",
  "Gas",
  "Shopping",
  "Subscriptions",
  "Entertainment",
  "Health & pharmacy",
  "Transportation",
  "Education",
  "Home & utilities",
  "Other",
];

export function merchantsInGroup(group: MerchantGroup) {
  return MERCHANT_PRESETS.filter((m) => m.group === group);
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function merchantSearchBlob(merchant: MerchantPreset): string {
  const domainStem = merchant.logoDomain?.split(".")[0] ?? "";
  return normalizeSearchText(
    [
      merchant.name,
      merchant.shortName,
      merchant.id.replace(/_/g, " "),
      domainStem,
      ...(merchant.searchAliases ?? []),
    ].join(" "),
  );
}

function scoreMerchantMatch(merchant: MerchantPreset, query: string): number {
  const q = normalizeSearchText(query);
  if (!q) return 0;

  const name = normalizeSearchText(merchant.name);
  const short = normalizeSearchText(merchant.shortName ?? "");
  const blob = merchantSearchBlob(merchant);

  if (name === q || short === q) return 100;
  if (name.startsWith(q) || short.startsWith(q)) return 90;
  if (blob.includes(q)) return 80;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => blob.includes(token))) {
    return 70;
  }

  return 0;
}

export function searchMerchantsInGroup(
  group: MerchantGroup,
  query: string,
  location: MerchantLocation,
  limit = 16,
): MerchantPreset[] {
  const q = query.trim();
  if (!q) return [];

  return MERCHANT_PRESETS.filter(
    (merchant) =>
      merchant.group === group &&
      merchant.kind === "brand" &&
      merchantAvailableAt(merchant, location),
  )
    .map((merchant) => ({
      merchant,
      score: scoreMerchantMatch(merchant, q),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.merchant.name.localeCompare(b.merchant.name),
    )
    .slice(0, limit)
    .map((entry) => entry.merchant);
}

export function merchantById(id: string): MerchantPreset | undefined {
  return MERCHANT_PRESETS.find((m) => m.id === id);
}

/** Popular brands shown as quick-pick tiles before search. */
export const FEATURED_BRAND_IDS: Partial<Record<MerchantGroup, string[]>> = {
  Groceries: ["loblaws", "metro", "costco", "sobeys", "walmart_grocery", "kroger", "safeway", "trader_joes"],
  "Food & drink": ["uber_eats", "tim_hortons", "starbucks", "mcdonalds", "doordash", "skip", "subway", "chipotle"],
  Travel: ["air_canada", "westjet", "marriott", "expedia", "airbnb", "booking", "hilton", "porter"],
  Gas: ["shell", "petro_canada", "esso", "husky", "circle_k", "canadian_tire_gas"],
  Shopping: ["amazon", "amazon_us", "walmart", "canadian_tire", "best_buy", "target", "ikea", "home_depot"],
  Subscriptions: ["spotify", "netflix", "rogers", "verizon", "att", "tmobile", "disney_plus", "youtube_premium"],
  Entertainment: ["cineplex", "amc", "steam", "xbox", "playstation", "ticketmaster", "apple_tv", "ea"],
  "Health & pharmacy": ["rexall", "london_drugs", "goodlife", "cvs", "walgreens", "peloton"],
  Transportation: ["uber", "lyft", "ttc", "presto", "go_transit", "mta", "clipper", "via_rail"],
  Education: ["coursera", "udemy", "uoft", "mcgill", "ubc", "ucla", "nyu", "khan_academy"],
  "Home & utilities": ["enbridge", "hydro_one", "toronto_hydro", "bc_hydro", "fortisbc", "pge", "sce", "sdge", "coned", "duke_energy"],
  Other: ["paypal", "venmo", "costco_wholesale", "charity"],
};

export function featuredBrandsInGroup(
  group: MerchantGroup,
  location: MerchantLocation,
  limit = 8,
): MerchantPreset[] {
  const featuredIds = FEATURED_BRAND_IDS[group] ?? [];
  const ordered = featuredIds
    .map((id) => merchantById(id))
    .filter((merchant): merchant is MerchantPreset => {
      if (!merchant) return false;
      return merchantAvailableAt(merchant, location);
    });

  if (ordered.length >= 4) return ordered.slice(0, limit);

  const used = new Set(ordered.map((merchant) => merchant.id));
  const backfill = MERCHANT_PRESETS.filter(
    (merchant) =>
      merchant.group === group &&
      merchant.kind === "brand" &&
      !used.has(merchant.id) &&
      merchantAvailableAt(merchant, location),
  ).sort((a, b) => a.name.localeCompare(b.name));

  return [...ordered, ...backfill].slice(0, limit);
}

export { merchantAvailableAt, type MerchantLocation } from "./merchantAvailability";
