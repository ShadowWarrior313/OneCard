/**
 * Online checkout signal extraction.
 *
 * V1 takes an already-parsed representation of a checkout page (DOM scrape or
 * JSON-LD) rather than scraping live — the engine stays pure and curated. The
 * job here is to turn raw page text into structured signals:
 *   - a merchant domain (for merchant resolution)
 *   - *item category hints* derived from cart contents
 *
 * CRITICAL: item hints are an input to the PRIOR, never an override of the
 * merchant MCC. They can only shift probability between the candidate MCCs the
 * merchant already codes as (enforced downstream in predict.ts / ambiguity-
 * rules.ts). That is what stops a razor at Walmart from inventing a "beauty"
 * category. This module only *suggests*; it never decides.
 */

import type { Category } from "../mcc/mcc-catalog.js";

/** Parsed checkout page. Any field may be absent. */
export interface OnlinePageInput {
  /** Checkout URL or host, e.g. "https://www.walmart.com/checkout". */
  url?: string;
  pageTitle?: string;
  /** JSON-LD blocks already parsed from <script type="application/ld+json">. */
  jsonLd?: Array<Record<string, unknown>>;
  /** Visible cart line-item names, e.g. ["Gillette razor", "AA batteries"]. */
  cartItemNames?: string[];
}

export interface OnlineSignals {
  domain?: string;
  /**
   * Category hints implied by the cart, each as a *ranked* list of plausible
   * categories (most specific first). Downstream code keeps only hints whose
   * category is actually one of the merchant's candidate MCC categories.
   */
  itemHints: Category[][];
  /** Free-text trace of what we read, for explainability/debugging. */
  notes: string[];
}

/**
 * Keyword → ranked category guesses. Deliberately conservative and editable.
 * The ranking matters: at a big-box, only the first guess that matches one of
 * the merchant's own candidate categories is applied; the rest are ignored
 * (e.g. "razor" suggests beauty/drugstore first, but Walmart codes neither, so
 * it falls through to "discount" — general merchandise).
 */
const ITEM_KEYWORD_HINTS: Array<{ match: RegExp; categories: Category[] }> = [
  // Personal care — would-be beauty/drugstore, but at a big-box these fall
  // through to general merchandise. This is the razor case.
  { match: /\b(razor|shav|toothpaste|shampoo|deodorant|cosmetic|makeup)\b/i, categories: ["beauty", "drugstore", "discount"] },
  // Snacks / candy — would-be convenience, but inside a host venue (hotel
  // sundry shop) this is correctly ignored so it stays the host's category.
  { match: /\b(candy|chocolate|snack|soda|gum|chips)\b/i, categories: ["convenience", "groceries"] },
  // Groceries / fresh food
  { match: /\b(milk|eggs|bread|produce|grocer|banana|cheese|yogurt|cereal)\b/i, categories: ["groceries"] },
  // Prepared / fast food
  { match: /\b(burger|fries|combo meal|taco|burrito|nuggets|whopper)\b/i, categories: ["fast_food", "dining"] },
  // Sit-down dining
  { match: /\b(entree|appetizer|reservation|prix fixe|wine pairing)\b/i, categories: ["dining"] },
  // Fuel
  { match: /\b(unleaded|diesel|gallons|fuel|gasoline|pump)\b/i, categories: ["gas"] },
  // Electronics
  { match: /\b(laptop|tv|monitor|headphones|console|charger|ssd)\b/i, categories: ["electronics", "discount"] },
  // Books
  { match: /\b(paperback|hardcover|novel|textbook|isbn)\b/i, categories: ["books"] },
];

function extractDomainFromJsonLd(blocks: Array<Record<string, unknown>>): string | undefined {
  for (const block of blocks) {
    const url = block["url"];
    if (typeof url === "string") return url;
  }
  return undefined;
}

/** Map a single cart item name to its ranked category guesses (if any). */
function hintForItem(name: string): Category[] | undefined {
  for (const { match, categories } of ITEM_KEYWORD_HINTS) {
    if (match.test(name)) return categories;
  }
  return undefined;
}

/** Turn a parsed checkout page into structured online signals. */
export function extractOnlineSignals(page: OnlinePageInput): OnlineSignals {
  const notes: string[] = [];
  const itemHints: Category[][] = [];

  const domain = page.url ?? (page.jsonLd ? extractDomainFromJsonLd(page.jsonLd) : undefined);
  if (domain) notes.push(`domain:${domain}`);

  for (const name of page.cartItemNames ?? []) {
    const hint = hintForItem(name);
    if (hint) {
      itemHints.push(hint);
      notes.push(`item "${name}" → ${hint.join(">")}`);
    } else {
      notes.push(`item "${name}" → no category hint`);
    }
  }

  return { domain, itemHints, notes };
}

/**
 * Convenience: turn a flat list of pre-classified item hints (e.g. from a host
 * app that already mapped items) into the ranked-list shape used internally.
 */
export function itemHintsFromCategories(cats: Category[]): Category[][] {
  return cats.map((c) => [c]);
}
