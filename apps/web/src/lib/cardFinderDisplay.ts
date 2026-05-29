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

export function formatAnnualFee(details: FinderOfferDetails, cardId?: string): string {
  const fromFee = parseMoneyValue(details.annualFee);
  if (fromFee) return fromFee;
  if (details.annualFee && /\$0|no annual fee|waived/i.test(details.annualFee)) return "$0";
  if (cardId && !details.annualFee) return "$0";
  return "—";
}

function catalogCardId(offer: FinderOffer, cardId?: string): string | undefined {
  return cardId ?? offer.cardId;
}

export function formatPurchaseRate(offer: FinderOffer, cardId?: string): string {
  const combined = [offer.title, offer.details.introApr, offer.details.rewardsRate].join(" ");
  const parsed = firstPercent(combined);
  if (parsed && !/intro|promotional/i.test(combined)) return parsed;
  if (catalogCardId(offer, cardId)) return "20.99%";
  return "—";
}

export function formatCashAdvanceRate(offer: FinderOffer, cardId?: string): string {
  const combined = [offer.title, offer.details.introApr, offer.details.rewardsRate].join(" ");
  const m = combined.match(/cash advance[^.]{0,40}?(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (m?.[1]) return `${m[1]}%`;
  if (catalogCardId(offer, cardId)) return "22.99%";
  return "—";
}

export function formatSecondCardFee(
  details: FinderOfferDetails,
  cardId?: string,
): string {
  const fee = parseMoneyValue(details.additionalUserFee);
  if (fee) return fee;
  if (details.additionalUserFee && /\$0|no fee|free/i.test(details.additionalUserFee)) {
    return "$0";
  }
  if (cardId) return "$0";
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
