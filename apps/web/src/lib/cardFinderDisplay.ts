import type { FinderOffer, FinderOfferDetails } from "@/types/cardFinder";

const PERCENT_RE = /(\d{1,2}(?:\.\d+)?)\s*%/;

function firstPercent(...sources: (string | undefined)[]): string | undefined {
  for (const src of sources) {
    if (!src) continue;
    const m = src.match(PERCENT_RE);
    if (m?.[1]) return `${m[1]}%`;
  }
  return undefined;
}

function parseMoneyValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const zero = /\$?\s*0\b/.test(raw) && !/\$?\s*[1-9]/.test(raw.replace(/\$?\s*0\b/g, ""));
  if (zero || /\$0\b/i.test(raw) || /no fee/i.test(raw)) return "$0";
  const m = raw.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (m?.[1]) return `$${m[1].replace(/,/g, "")}`;
  return undefined;
}

/**
 * Display helpers for Card Finder comparison stats.
 *
 * Never invent APR or fee numbers. Missing issuer data must surface as "—" so
 * users are not steered by fabricated purchase rates, cash-advance rates, or
 * "$0" fees. Rewards cashback strings must never be parsed as purchase APR.
 */
export function formatAnnualFee(details: FinderOfferDetails, _cardId?: string): string {
  const fromFee = parseMoneyValue(details.annualFee);
  if (fromFee) return fromFee;
  if (details.annualFee && /\$0|no annual fee|waived/i.test(details.annualFee)) return "$0";
  return "—";
}

export function formatPurchaseRate(offer: FinderOffer, _cardId?: string): string {
  // Only trust an explicit APR field that is clearly an ongoing purchase rate.
  // Do not scan title/rewardsRate — those commonly contain cashback percents
  // (e.g. "1% base earn") that would be mislabeled as purchase APR.
  const aprField = offer.details.introApr?.trim();
  if (!aprField) return "—";
  if (/intro|promotional|for\s+\d+\s+months?/i.test(aprField)) return "—";
  return firstPercent(aprField) ?? "—";
}

export function formatCashAdvanceRate(offer: FinderOffer, _cardId?: string): string {
  // No dedicated cash-advance field — only surface an explicit cash-advance APR.
  const sources = [offer.details.introApr, offer.title].filter(Boolean).join(" ");
  const m = sources.match(/cash advance[^.]{0,40}?(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (m?.[1]) return `${m[1]}%`;
  return "—";
}

export function formatSecondCardFee(
  details: FinderOfferDetails,
  _cardId?: string,
): string {
  const fee = parseMoneyValue(details.additionalUserFee);
  if (fee) return fee;
  if (details.additionalUserFee && /\$0|no fee|free/i.test(details.additionalUserFee)) {
    return "$0";
  }
  return "—";
}

export function hasOfferBadge(offer: FinderOffer): boolean {
  return Boolean(
    offer.details.welcomeBonus ||
      offer.source === "structured" ||
      offer.details.minSpend,
  );
}

export function offerKey(offer: FinderOffer): string {
  return `${offer.providerId}::${offer.url}::${offer.title}`;
}
