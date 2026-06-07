/**
 * The ambiguous-merchant fixtures — the real-world failure cases the engine
 * must provably handle. Each is a purchase context fed to recommend(); the
 * assertions live in scenarios.test.ts.
 *
 * These are curated inputs, not live data.
 */

import type { MerchantContext } from "../../mcc/predict.js";

export interface Fixture {
  name: string;
  description: string;
  context: MerchantContext;
  amount: number;
}

/** Razor at Walmart — must recommend on the merchant MCC; item is irrelevant. */
export const WALMART_RAZOR: Fixture = {
  name: "walmart_razor",
  description:
    "A razor at Walmart. Walmart codes basket-level as discount/grocery; the item type must NOT invent a beauty/drugstore category.",
  context: {
    merchantKey: "walmart",
    channel: "online",
    online: {
      url: "https://www.walmart.com/checkout",
      cartItemNames: ["Gillette Mach3 razor", "AA batteries"],
    },
  },
  amount: 12,
};

/** Same store, grocery-heavy cart — cart nudges the prior WITHIN Walmart's MCCs. */
export const WALMART_GROCERIES: Fixture = {
  name: "walmart_groceries",
  description:
    "A grocery-heavy basket at Walmart. Cart hints may shift the prior toward grocery (still a Walmart MCC), but never invent a new category.",
  context: {
    merchantKey: "walmart",
    channel: "online",
    online: {
      url: "https://www.walmart.com/checkout",
      cartItemNames: ["milk", "eggs", "bread", "bananas", "cereal"],
    },
  },
  amount: 80,
};

/** Costco warehouse — single dominant wholesale MCC. */
export const COSTCO_WAREHOUSE: Fixture = {
  name: "costco_warehouse",
  description: "A Costco warehouse run. Codes as wholesale; high confidence.",
  context: { merchantKey: "costco", channel: "in_person" },
  amount: 220,
};

/** Costco gas — same merchant, the minority fuel sub-venue flips it to gas. */
export const COSTCO_GAS: Fixture = {
  name: "costco_gas",
  description:
    "Costco fuel pump. Knowing the sub-venue flips the prediction to gas with high confidence.",
  context: { merchantKey: "costco", channel: "in_person", subVenue: "fuel" },
  amount: 60,
};

/** Hotel sundry candy bar — host-venue bleed keeps it lodging. */
export const HOTEL_CANDY: Fixture = {
  name: "hotel_candy",
  description:
    "A candy bar from a hotel sundry shop. Host-venue bleed: it codes as lodging, NOT convenience — the candy hint is ignored.",
  context: {
    merchantKey: "marriott",
    channel: "in_person",
    online: { cartItemNames: ["chocolate candy bar"] },
  },
  amount: 4,
};

/** Gas station with attached Burger King — composite → split recommendation. */
export const GAS_QSR_COMPOSITE: Fixture = {
  name: "gas_qsr_composite",
  description:
    "A truck-stop Mobil with an attached Burger King. Composite venue: pump (gas) vs inside (fast food) is a coin-flip → split recommendation.",
  context: { merchantKey: "mobil_bk", channel: "in_person" },
  amount: 30,
};

/** Food truck — mobile prior, convenience/misc dominate → catch-all via EV. */
export const FOOD_TRUCK: Fixture = {
  name: "food_truck",
  description:
    "A street food truck. Frequently codes convenience/misc rather than dining; low confidence → robust catch-all wins on expected value.",
  context: { merchantKey: "food_truck", channel: "in_person" },
  amount: 18,
};

/** Clean grocery store — single MCC, high confidence. */
export const CLEAN_GROCERY: Fixture = {
  name: "clean_grocery",
  description: "A straightforward Safeway run. Single dominant grocery MCC; high confidence, clean recommendation.",
  context: { merchantKey: "safeway", channel: "in_person" },
  amount: 95,
};

/** Generic unknown online merchant — fail safe to catch-all at low confidence. */
export const UNKNOWN_ONLINE: Fixture = {
  name: "unknown_online",
  description:
    "An unknown online merchant. We can't predict the category → low confidence → recommend the robust catch-all, never a confident wrong category.",
  context: {
    channel: "online",
    domain: "some-random-shop.example",
    merchantName: "Some Random Shop",
    online: { url: "https://some-random-shop.example/cart", cartItemNames: ["mystery item"] },
  },
  amount: 40,
};

export const ALL_FIXTURES: Fixture[] = [
  WALMART_RAZOR,
  WALMART_GROCERIES,
  COSTCO_WAREHOUSE,
  COSTCO_GAS,
  HOTEL_CANDY,
  GAS_QSR_COMPOSITE,
  FOOD_TRUCK,
  CLEAN_GROCERY,
  UNKNOWN_ONLINE,
];
