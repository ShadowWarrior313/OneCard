/** Partner merchant IDs used in card-specific earn rules. */

/** Scotiabank Scene+ participating grocers (scotiabank.com/participatingstores) */
export const SCENE_GROCERY_MERCHANTS = [
  "sobeys",
  "freshco",
  "iga",
  "safeway",
] as const;

/** Loblaw-affiliated banners — PC Optimum elevated earn + no Amex acceptance.
 *  Walmart is not a PC Optimum grocery partner; it stays in AMEX_GROCERY_EXCLUSIONS
 *  (Cobalt 5× does not apply) but must not receive PC banner grocery rates. */
export const PC_GROCERY_MERCHANTS = [
  "loblaws",
  "no_frills",
  "superstore",
  "food_basics",
] as const;

export const PC_PARTNER_MERCHANTS = [
  ...PC_GROCERY_MERCHANTS,
  "shoppers",
  "esso",
] as const;

/** Grocery merchants where Amex Cobalt 5x does NOT apply or card isn't accepted */
export const AMEX_GROCERY_EXCLUSIONS = [
  "loblaws",
  "no_frills",
  "superstore",
  "food_basics",
  "costco",
  "costco_wholesale",
  "save_on_foods",
  "walmart_grocery",
] as const;

/** Air Canada co-brand partner purchases */
export const AEROPLAN_AIRLINE_MERCHANTS = ["air_canada"] as const;

/** WestJet co-brand partner purchases */
export const WESTJET_AIRLINE_MERCHANTS = ["westjet"] as const;

/** Marriott Bonvoy Amex partner hotels */
export const MARRIOTT_PARTNER_MERCHANTS = ["marriott"] as const;
