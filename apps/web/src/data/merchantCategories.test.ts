/**
 * Guard: curated brand merchants must carry the reward category their MCC
 * implies. resolveCategory prefers merchant.category over MCC, so labeling
 * transit / pharmacy / cinema as "other" silently drops category bonuses and
 * picks the wrong card (e.g. Cobalt base rate over CIBC 4% transit on Presto).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MERCHANT_BRAND_DEFS } from "./merchantBrands.ts";

const EXPECTED: Array<{ id: string; category: string }> = [
  { id: "presto", category: "transportation" },
  { id: "ttc", category: "transportation" },
  { id: "go_transit", category: "transportation" },
  { id: "uber", category: "transportation" },
  { id: "lyft", category: "transportation" },
  { id: "mta", category: "transportation" },
  { id: "clipper", category: "transportation" },
  { id: "shoppers", category: "drugstore" },
  { id: "rexall", category: "drugstore" },
  { id: "london_drugs", category: "drugstore" },
  { id: "cvs", category: "drugstore" },
  { id: "walgreens", category: "drugstore" },
  { id: "cineplex", category: "entertainment" },
  { id: "ticketmaster", category: "entertainment" },
  { id: "amc", category: "entertainment" },
  { id: "steam", category: "streaming" },
  { id: "xbox", category: "streaming" },
  { id: "playstation", category: "streaming" },
  { id: "ea", category: "streaming" },
  { id: "coursera", category: "education" },
  { id: "udemy", category: "education" },
  { id: "goodlife", category: "fitness" },
  { id: "peloton", category: "fitness" },
];

describe("merchant brand reward categories", () => {
  for (const { id, category } of EXPECTED) {
    it(`${id} is categorized as ${category}`, () => {
      const merchant = MERCHANT_BRAND_DEFS.find((m) => m.id === id);
      assert.ok(merchant, `missing merchant ${id}`);
      assert.equal(merchant.category, category);
    });
  }
});
