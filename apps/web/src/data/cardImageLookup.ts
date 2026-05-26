import type { CardProduct } from "@onecard/shared-types";

/**
 * Known Rewards CC cardKey values. The API is US-centric; where a Canadian card
 * is missing we map to the closest issuer-branded art when it still reads well.
 */
export const CARD_IMAGE_KEY_OVERRIDES: Partial<Record<string, string>> = {
  amex_platinum: "amex-platinum",
  amex_gold: "amex-gold",
  amex_green: "amex-green",
  amex_marriott: "amex-marriott-bonvoy-brilliant",
  amex_simplycash_preferred: "amex-blue-cash-preferred",
};

/** Search strings tuned for name lookup when no cardKey override exists. */
export const CARD_IMAGE_SEARCH_OVERRIDES: Partial<Record<string, string>> = {
  amex_cobalt: "Cobalt",
  amex_choice: "Choice",
  cibc_aeroplan_infinite: "Aeroplan Infinite",
  cibc_aventura_infinite: "Aventura Infinite",
  cibc_dividend_infinite: "Dividend Infinite",
  cibc_costco: "Costco",
  rbc_avion_infinite: "Avion Infinite",
  rbc_avion_infinite_privilege: "Avion Infinite Privilege",
  rbc_westjet: "WestJet",
  td_aeroplan_infinite: "Aeroplan Infinite",
  td_aeroplan_platinum: "Aeroplan Platinum",
  scotia_scene: "Scene",
  scotia_passport: "Passport",
  scotia_gold_amex: "Gold American Express",
  bmo_eclipse: "Eclipse",
  bmo_ascend: "Ascend",
  bmo_airmiles: "Air Miles",
  nbc_platinum: "Platinum Mastercard",
  pc_world_elite_mc: "World Elite Mastercard",
};

const NOISE =
  /\b(card|credit card|visa|mastercard|world elite|infinite|privilege|rewards|mc|®|™)\b/gi;

function defaultSearchTerm(displayName: string, issuer: string): string {
  let term = displayName
    .replace(new RegExp(`^${issuer}\\s*`, "i"), "")
    .replace(/american express\s*/i, "")
    .replace(NOISE, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (term.length < 4) {
    term = displayName.replace(NOISE, " ").replace(/\s+/g, " ").trim();
  }

  return term.slice(0, 48);
}

export function cardImageKeyOverride(cardId: string): string | undefined {
  return CARD_IMAGE_KEY_OVERRIDES[cardId];
}

export function cardImageSearchTerm(card: CardProduct): string {
  return (
    CARD_IMAGE_SEARCH_OVERRIDES[card.cardId] ??
    defaultSearchTerm(card.displayName, card.issuer)
  );
}
