import type { TaxCountry } from "@/lib/taxes";

export type MerchantLocation = {
  country: TaxCountry;
  region: string;
};

/** Where a brand is relevant. Omit = available everywhere. Sectors are always shown. */
export type MerchantAvailability = {
  countries?: TaxCountry[];
  /** Province / state codes within the allowed countries */
  regions?: string[];
};

export const MERCHANT_AVAILABILITY: Record<string, MerchantAvailability> = {
  // Groceries — Canada
  loblaws: { countries: ["CA"] },
  metro: { countries: ["CA"] },
  sobeys: { countries: ["CA"] },
  no_frills: { countries: ["CA"] },
  superstore: { countries: ["CA"] },
  save_on_foods: { countries: ["CA"], regions: ["BC", "AB", "SK", "MB", "ON"] },
  farm_boy: { countries: ["CA"], regions: ["ON"] },
  longos: { countries: ["CA"], regions: ["ON"] },
  food_basics: { countries: ["CA"], regions: ["ON"] },
  freshco: { countries: ["CA"] },
  iga: { countries: ["CA"] },
  walmart_grocery: { countries: ["CA"] },
  kroger: { countries: ["US"] },
  safeway: { countries: ["US"] },
  trader_joes: { countries: ["US"] },
  publix: { countries: ["US"], regions: ["FL", "GA", "AL", "SC", "NC", "TN", "VA"] },
  albertsons: { countries: ["US"] },

  // Food & drink — Canada-first
  skip: { countries: ["CA"] },
  swiss_chalet: { countries: ["CA"] },
  boston_pizza: { countries: ["CA"] },
  pizza_pizza: { countries: ["CA"] },
  harveys: { countries: ["CA"] },
  montanas: { countries: ["CA"] },
  st_hubert: { countries: ["CA"], regions: ["QC", "ON", "NB", "NS", "PE"] },
  second_cup: { countries: ["CA"] },
  earls: { countries: ["CA"] },
  cactus_club: { countries: ["CA"], regions: ["BC", "AB", "ON"] },
  aw: { countries: ["CA"] },

  // Travel — Canada carriers
  air_canada: { countries: ["CA"] },
  westjet: { countries: ["CA"] },
  porter: { countries: ["CA"] },

  // Gas — Canada
  petro_canada: { countries: ["CA"] },
  esso: { countries: ["CA"] },
  husky: { countries: ["CA"], regions: ["BC", "AB", "SK", "MB"] },
  canadian_tire_gas: { countries: ["CA"] },
  chevron: { countries: ["US"] },
  bp: { countries: ["US"] },
  exxon: { countries: ["US"] },

  // Shopping — Canada
  canadian_tire: { countries: ["CA"] },
  shoppers: { countries: ["CA"] },
  hudsons_bay: { countries: ["CA"] },
  winners: { countries: ["CA"] },
  dollarama: { countries: ["CA"] },
  indigo: { countries: ["CA"] },
  walmart: { countries: ["CA"] },
  amazon: { countries: ["CA"] },
  amazon_us: { countries: ["US"] },
  target: { countries: ["US"] },

  // Subscriptions — Canada telecom
  rogers: { countries: ["CA"], regions: ["ON", "BC", "AB", "MB", "SK", "QC", "NB", "NS", "PE", "NL"] },
  bell: { countries: ["CA"] },
  telus: { countries: ["CA"], regions: ["BC", "AB", "MB", "SK", "QC", "ON"] },
  crave: { countries: ["CA"] },
  amazon_prime: { countries: ["CA"] },
  verizon: { countries: ["US"] },
  att: { countries: ["US"] },
  tmobile: { countries: ["US"] },

  // Entertainment — Canada
  cineplex: { countries: ["CA"] },
  amc: { countries: ["US"] },

  // Health — regional
  rexall: { countries: ["CA"], regions: ["ON", "AB", "MB", "SK", "BC"] },
  london_drugs: { countries: ["CA"], regions: ["BC", "AB", "SK", "MB"] },
  cvs: { countries: ["US"] },
  walgreens: { countries: ["US"] },

  // Transportation — regional
  ttc: { countries: ["CA"], regions: ["ON"] },
  presto: { countries: ["CA"], regions: ["ON"] },
  go_transit: { countries: ["CA"], regions: ["ON"] },
  via_rail: { countries: ["CA"] },
  mta: { countries: ["US"], regions: ["NY"] },
  clipper: { countries: ["US"], regions: ["CA"] },

  // Education — Canada campuses
  uoft: { countries: ["CA"], regions: ["ON"] },
  mcgill: { countries: ["CA"], regions: ["QC"] },
  ubc: { countries: ["CA"], regions: ["BC"] },
  ucla: { countries: ["US"], regions: ["CA"] },
  nyu: { countries: ["US"], regions: ["NY"] },

  // Utilities — highly regional
  enbridge: { countries: ["CA"], regions: ["ON", "AB", "MB", "SK", "NB", "NS", "PE", "NL", "QC"] },
  hydro_one: { countries: ["CA"], regions: ["ON"] },
  toronto_hydro: { countries: ["CA"], regions: ["ON"] },
  bc_hydro: { countries: ["CA"], regions: ["BC"] },
  fortisbc: { countries: ["CA"], regions: ["BC"] },
  pge: { countries: ["US"], regions: ["CA"] },
  sce: { countries: ["US"], regions: ["CA"] },
  sdge: { countries: ["US"], regions: ["CA"] },
  coned: { countries: ["US"], regions: ["NY"] },
  duke_energy: { countries: ["US"] },

  // Other
  venmo: { countries: ["US"] },
  costco_wholesale: { countries: ["CA"] },
};

export function merchantAvailableAt(
  merchant: { id: string; kind: "brand" | "sector"; availability?: MerchantAvailability },
  location: MerchantLocation,
): boolean {
  if (merchant.kind === "sector") return true;

  const availability =
    merchant.availability ?? MERCHANT_AVAILABILITY[merchant.id];
  if (!availability) return true;

  if (
    availability.countries &&
    !availability.countries.includes(location.country)
  ) {
    return false;
  }

  if (availability.regions && availability.regions.length > 0) {
    return availability.regions.includes(location.region);
  }

  return true;
}

export function filterMerchantsByLocation<T extends { id: string; kind: "brand" | "sector"; availability?: MerchantAvailability }>(
  merchants: T[],
  location: MerchantLocation,
): T[] {
  return merchants.filter((merchant) => merchantAvailableAt(merchant, location));
}
