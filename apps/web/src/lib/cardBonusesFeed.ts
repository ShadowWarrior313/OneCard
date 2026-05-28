import type { FinderOffer, FinderProfile } from "@/types/cardFinder";

/** Public SUB dataset (US-focused). Not affiliated with Credit Karma. */
const DEFAULT_BONUSES_API_URL =
  "https://raw.githubusercontent.com/andenacitelli/credit-card-bonuses-api/main/exports/data.json";

const ISSUER_LABELS: Record<string, string> = {
  AMERICAN_EXPRESS: "American Express",
  BANK_OF_AMERICA: "Bank of America",
  BARCLAYS: "Barclays",
  BREX: "Brex",
  CHASE: "Chase",
  CAPITAL_ONE: "Capital One",
  CITI: "Citi",
  COMENITY: "Comenity",
  DISCOVER: "Discover",
  FIRST: "First",
  FNBO: "FNBO",
  PENFED: "PenFed",
  PNC: "PNC",
  SYNCHRONY: "Synchrony",
  US_BANK: "U.S. Bank",
  WEB_BANK: "WebBank",
  WELLS_FARGO: "Wells Fargo",
};

const POINTS_CURRENCIES = new Set([
  "AMERICAN_EXPRESS",
  "CHASE",
  "CITI",
  "CAPITAL_ONE",
  "BANK_OF_AMERICA",
  "BARCLAYS",
  "BILT",
  "BREX",
  "DISCOVER",
  "US_BANK",
  "WELLS_FARGO",
]);

const MILES_CURRENCIES = new Set([
  "DELTA",
  "UNITED",
  "SOUTHWEST",
  "AMERICAN",
  "ALASKA",
  "JETBLUE",
  "FRONTIER",
  "SPIRIT",
  "HAWAIIAN",
  "AEROPLAN",
  "AVIOS",
  "AVIANCA",
  "LATAM",
  "LUFTHANSA",
  "FLYING_BLUE",
  "EMIRATES",
  "ANA",
  "KOREAN",
  "VIRGIN",
  "CATHAY_PACIFIC",
]);

const HOTEL_CURRENCIES = new Set([
  "MARRIOTT",
  "HILTON",
  "HYATT",
  "IHG",
  "WYNDHAM",
  "CHOICE",
  "BEST_WESTERN",
  "RADISSON",
]);

type BonusesOfferAmount = { amount: number; currency?: string };
type BonusesOffer = {
  spend: number;
  amount: BonusesOfferAmount[];
  days: number;
  expiration?: string;
  url?: string;
  details?: string;
};
export type BonusesCreditCard = {
  cardId: string;
  name: string;
  issuer: string;
  currency: string;
  isBusiness: boolean;
  annualFee: number;
  isAnnualFeeWaived: boolean;
  universalCashbackPercent: number;
  url: string;
  offers: BonusesOffer[];
  discontinued?: boolean;
  countsTowards524?: boolean;
  details?: string;
};

const BONUS_KEYWORDS = /(welcome|bonus|earn|points|miles|cash\s?back|cashback|offer)/i;
const STUDENT_KEYWORDS = /(student|beginner|starter|building|secured)/i;
const PREMIUM_KEYWORDS = /(infinite|reserve|platinum|world\s?elite|premium|preferred)/i;
const TRAVEL_KEYWORDS = /(travel|miles|aeroplan|hotel|flight|airline|skymiles|avios)/i;
const CASHBACK_KEYWORDS = /(cash\s?back|cashback|groceries|gas|dining)/i;

function issuerLabel(issuer: string): string {
  return ISSUER_LABELS[issuer] ?? issuer.replace(/_/g, " ");
}

function issuerId(issuer: string): string {
  return issuer.toLowerCase().replace(/_/g, "-");
}

function currencyUnit(currency: string): string {
  if (currency === "USD") return "cash back";
  if (POINTS_CURRENCIES.has(currency)) return "points";
  if (MILES_CURRENCIES.has(currency)) return "miles";
  if (HOTEL_CURRENCIES.has(currency)) return "points";
  return "bonus";
}

function formatBonusAmount(amount: number, amountCurrency: string | undefined, cardCurrency: string): string {
  const c = amountCurrency ?? cardCurrency;
  if (c === "USD") return `$${amount.toLocaleString("en-US")}`;
  return `${amount.toLocaleString("en-US")} ${currencyUnit(c)}`;
}

function pickBestOffer(card: BonusesCreditCard): BonusesOffer | null {
  const offers = card.offers?.filter((o) => o.amount?.length) ?? [];
  if (offers.length === 0) return null;
  return offers.reduce((best, cur) => {
    const bestVal = best.amount.reduce((s, a) => s + a.amount, 0);
    const curVal = cur.amount.reduce((s, a) => s + a.amount, 0);
    return curVal > bestVal ? cur : best;
  });
}

function formatAnnualFee(card: BonusesCreditCard): string {
  if (card.annualFee === 0) return "$0 annual fee";
  const base = `$${card.annualFee.toLocaleString("en-US")} annual fee`;
  return card.isAnnualFeeWaived ? `${base} (waived first year)` : base;
}

function scoreStructuredCard(card: BonusesCreditCard, offer: BonusesOffer, profile: FinderProfile): { score: number; reasons: string[] } {
  let score = 2;
  const reasons: string[] = ["Structured welcome-bonus data"];
  const title = `${card.name} ${issuerLabel(card.issuer)}`.toLowerCase();

  if (BONUS_KEYWORDS.test(title)) {
    score += 2;
    reasons.push("Has documented sign-up bonus");
  }

  if (profile.isStudent) {
    if (STUDENT_KEYWORDS.test(title)) {
      score += 4;
      reasons.push("Matches student profile");
    }
    if (card.isBusiness || PREMIUM_KEYWORDS.test(title)) {
      score -= 2;
      reasons.push("May be harder for student applicants");
    }
  } else if (!profile.isStudent && PREMIUM_KEYWORDS.test(title) && (profile.creditBand === "good" || profile.creditBand === "excellent")) {
    score += 2;
    reasons.push("Likely fit for stronger credit profile");
  }

  if (profile.creditBand === "building" || profile.creditBand === "fair") {
    if (card.annualFee >= 250 || PREMIUM_KEYWORDS.test(title)) {
      score -= 2;
      reasons.push("Higher fee tier — verify approval odds");
    }
    if (card.annualFee === 0) {
      score += 1;
      reasons.push("No annual fee");
    }
  }

  const isTravel =
    TRAVEL_KEYWORDS.test(title) ||
    MILES_CURRENCIES.has(card.currency) ||
    HOTEL_CURRENCIES.has(card.currency);
  const isCashback = card.currency === "USD" || CASHBACK_KEYWORDS.test(title);

  if (profile.rewardFocus === "travel" && isTravel) {
    score += 2;
    reasons.push("Aligned with travel rewards goal");
  }
  if (profile.rewardFocus === "cashback" && isCashback) {
    score += 2;
    reasons.push("Aligned with cashback goal");
  }
  if (profile.rewardFocus === "points" && (POINTS_CURRENCIES.has(card.currency) || /points|miles|mr\b/i.test(title))) {
    score += 2;
    reasons.push("Aligned with points strategy");
  }

  if (profile.openedCardsLast12Months >= 5 && card.countsTowards524 !== false && card.issuer === "CHASE") {
    score -= 3;
    reasons.push("Likely subject to Chase 5/24 — be selective");
  } else if (profile.openedCardsLast12Months >= 3) {
    score -= 1;
    reasons.push("Recent card activity suggests being selective");
  }

  const bonusTotal = offer.amount.reduce((s, a) => s + a.amount, 0);
  if (bonusTotal >= 50000 && !MILES_CURRENCIES.has(card.currency) && card.currency !== "USD") {
    score += 1;
    reasons.push("Large points/miles bonus");
  }
  if (card.currency === "USD" && bonusTotal >= 200) {
    score += 1;
    reasons.push("Strong cash sign-up bonus");
  }

  return { score, reasons };
}

export async function fetchCardBonusesFeed(): Promise<BonusesCreditCard[]> {
  const url = process.env.CARD_BONUSES_API_URL ?? DEFAULT_BONUSES_API_URL;
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Card bonuses feed HTTP ${res.status}`);
  const data = (await res.json()) as BonusesCreditCard[];
  return data.filter((c) => !c.discontinued && (c.offers?.length ?? 0) > 0);
}

export function bonusesCardsToOffers(cards: BonusesCreditCard[], profile: FinderProfile): FinderOffer[] {
  const offers: FinderOffer[] = [];

  for (const card of cards) {
    const offer = pickBestOffer(card);
    if (!offer) continue;

    const providerName = issuerLabel(card.issuer);
    const title = card.isBusiness ? `${card.name} (Business)` : card.name;
    const welcomeBonus = offer.amount.map((a) => formatBonusAmount(a.amount, a.currency, card.currency)).join(" + ");
    const minSpend = `$${offer.spend.toLocaleString("en-US")} in ${offer.days} days`;
    const rewardsRate =
      card.universalCashbackPercent > 0
        ? `${card.universalCashbackPercent}% base earn`
        : undefined;

    const { score, reasons } = scoreStructuredCard(card, offer, profile);

    offers.push({
      providerId: issuerId(card.issuer),
      providerName,
      title,
      url: offer.url ?? card.url,
      score,
      reasons,
      source: "structured",
      details: {
        welcomeBonus,
        minSpend,
        annualFee: formatAnnualFee(card),
        rewardsRate,
        offerExpiry: offer.expiration
          ? `Valid through ${offer.expiration}`
          : undefined,
      },
    });
  }

  return offers;
}
