import { CARD_FINDER_PROVIDERS, type CardProvider } from "@/data/cardFinderProviders";

type CreditBand = "building" | "fair" | "good" | "excellent";
type RewardFocus = "cashback" | "travel" | "points" | "balanced";
type Region = "CA" | "US";

type FinderProfile = {
  region: Region;
  isStudent: boolean;
  creditBand: CreditBand;
  creditScore?: number;
  rewardFocus: RewardFocus;
  openedCardsLast12Months: number;
};

type ScrapedOffer = {
  providerId: string;
  providerName: string;
  title: string;
  url: string;
  score: number;
  reasons: string[];
  details: {
    annualFee?: string;
    additionalUserFee?: string;
    welcomeBonus?: string;
    minSpend?: string;
    rewardsRate?: string;
    offerExpiry?: string;
    introApr?: string;
  };
};

const OFFER_KEYWORDS = /(credit|card|cards|student|cash\s?back|cashback|rewards|travel|bonus|welcome|offer|points)/i;
const BONUS_KEYWORDS = /(welcome|bonus|earn|points|miles|cash\s?back|cashback|offer)/i;
const STUDENT_KEYWORDS = /(student|beginner|starter|building|secured)/i;
const PREMIUM_KEYWORDS = /(infinite|reserve|platinum|world\s?elite|premium|preferred)/i;
const TRAVEL_KEYWORDS = /(travel|miles|aeroplan|hotel|flight|airline)/i;
const CASHBACK_KEYWORDS = /(cash\s?back|cashback|groceries|gas|dining)/i;

function creditBandFromScore(score: number): CreditBand {
  if (score < 580) return "building";
  if (score < 670) return "fair";
  if (score < 740) return "good";
  return "excellent";
}

function parseProfile(url: URL): FinderProfile {
  const region = (url.searchParams.get("region")?.toUpperCase() === "US" ? "US" : "CA") as Region;
  const isStudent = url.searchParams.get("isStudent") === "true";
  const creditBandRaw = url.searchParams.get("creditBand") ?? "good";
  const creditScoreRaw = Number(url.searchParams.get("creditScore") ?? "");
  const rewardFocusRaw = url.searchParams.get("rewardFocus") ?? "balanced";
  const openedRaw = Number(url.searchParams.get("openedCardsLast12Months") ?? "0");
  const creditScore =
    Number.isFinite(creditScoreRaw) && creditScoreRaw >= 300 && creditScoreRaw <= 850
      ? Math.round(creditScoreRaw)
      : undefined;

  const selectedBand: CreditBand =
    creditBandRaw === "building" || creditBandRaw === "fair" || creditBandRaw === "excellent"
      ? creditBandRaw
      : "good";
  const creditBand: CreditBand = creditScore ? creditBandFromScore(creditScore) : selectedBand;
  const rewardFocus: RewardFocus =
    rewardFocusRaw === "cashback" || rewardFocusRaw === "travel" || rewardFocusRaw === "points"
      ? rewardFocusRaw
      : "balanced";

  return {
    region,
    isStudent,
    creditBand,
    creditScore,
    rewardFocus,
    openedCardsLast12Months: Number.isFinite(openedRaw) ? Math.max(0, openedRaw) : 0,
  };
}

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return null;
  return titleMatch[1].replace(/\s+/g, " ").trim();
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function firstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[0]) return m[0].replace(/\s+/g, " ").trim();
  }
  return undefined;
}

function extractOfferDetails(text: string): ScrapedOffer["details"] {
  const annualFee = firstMatch(text, [
    /\$?\s?\d{1,4}\s*(?:\/?\s*year|annual)\s*fee/gi,
    /annual fee\s*[:\-]?\s*\$?\s?\d{1,4}/gi,
    /\$0\s*annual fee/gi,
  ]);

  const additionalUserFee = firstMatch(text, [
    /additional (?:cardholder|card|authorized user)\s*fee\s*[:\-]?\s*\$?\s?\d{1,4}/gi,
    /authorized user fee\s*[:\-]?\s*\$?\s?\d{1,4}/gi,
    /supplementary card fee\s*[:\-]?\s*\$?\s?\d{1,4}/gi,
  ]);

  const welcomeBonus = firstMatch(text, [
    /(?:up to\s*)?\d[\d,]{2,}\s*(?:points|miles|MR|scene\+|cashback|cash back)/gi,
    /welcome bonus[^.]{0,80}/gi,
    /earn\s+\d[\d,]{2,}\s*(?:points|miles)/gi,
  ]);

  const minSpend = firstMatch(text, [
    /(?:spend|purchase)\s+\$?\s?\d[\d,]{2,}\s*(?:in|within)\s*(?:the\s*)?\d+\s*(?:months?|days?)/gi,
    /after spending[^.]{0,90}/gi,
  ]);

  const rewardsRate = firstMatch(text, [
    /\d(?:\.\d+)?x\s*(?:points?|miles?|rewards?)/gi,
    /\d+(?:\.\d+)?%\s*(?:cash\s?back|rewards?)/gi,
  ]);

  const offerExpiry = firstMatch(text, [
    /offer(?:\s+ends?|\s+valid)?\s*(?:on|until|by)?\s*[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/gi,
    /valid until\s+[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/gi,
    /ends?\s+[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/gi,
  ]);

  const introApr = firstMatch(text, [
    /\d{1,2}(?:\.\d+)?%\s*(?:intro|promotional)\s*APR/gi,
    /intro APR[^.]{0,70}/gi,
  ]);

  return {
    annualFee,
    additionalUserFee,
    welcomeBonus,
    minSpend,
    rewardsRate,
    offerExpiry,
    introApr,
  };
}

function extractOfferCandidates(html: string, baseUrl: string): Array<{ title: string; url: string; details: ScrapedOffer["details"] }> {
  const matches = [...html.matchAll(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set<string>();
  const rows: Array<{ title: string; url: string; details: ScrapedOffer["details"] }> = [];

  for (const m of matches) {
    const hrefRaw = (m[2] ?? "").trim();
    const label = stripHtml(m[3] ?? "");
    if (!hrefRaw || !label) continue;
    if (hrefRaw.startsWith("#") || hrefRaw.startsWith("mailto:") || hrefRaw.startsWith("tel:")) continue;
    if (!OFFER_KEYWORDS.test(`${hrefRaw} ${label}`)) continue;

    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(hrefRaw, baseUrl).toString();
    } catch {
      continue;
    }
    const key = `${absoluteUrl}::${label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const idx = m.index ?? 0;
    const contextRaw = html.slice(Math.max(0, idx - 500), Math.min(html.length, idx + 800));
    const contextText = stripHtml(contextRaw);
    const details = extractOfferDetails(`${label} ${contextText}`);
    rows.push({ title: label, url: absoluteUrl, details });
    if (rows.length >= 18) break;
  }

  return rows;
}

function scoreOffer(offerTitle: string, profile: FinderProfile): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const t = offerTitle.toLowerCase();

  if (BONUS_KEYWORDS.test(t)) {
    score += 3;
    reasons.push("Mentions welcome bonus/rewards");
  }

  if (profile.isStudent && STUDENT_KEYWORDS.test(t)) {
    score += 4;
    reasons.push("Matches student profile");
  }

  if (!profile.isStudent && PREMIUM_KEYWORDS.test(t) && (profile.creditBand === "good" || profile.creditBand === "excellent")) {
    score += 2;
    reasons.push("Likely fit for stronger credit profile");
  }

  if (profile.creditBand === "building" || profile.creditBand === "fair") {
    if (STUDENT_KEYWORDS.test(t)) {
      score += 2;
      reasons.push("Potentially easier approval category");
    }
    if (PREMIUM_KEYWORDS.test(t)) {
      score -= 2;
      reasons.push("May require higher credit profile");
    }
  }

  if (profile.rewardFocus === "travel" && TRAVEL_KEYWORDS.test(t)) {
    score += 2;
    reasons.push("Aligned with travel rewards goal");
  }
  if (profile.rewardFocus === "cashback" && CASHBACK_KEYWORDS.test(t)) {
    score += 2;
    reasons.push("Aligned with cashback goal");
  }
  if (profile.rewardFocus === "points" && /(points|miles|membership rewards|scene\+|aeroplan)/i.test(t)) {
    score += 2;
    reasons.push("Aligned with points strategy");
  }

  if (profile.openedCardsLast12Months >= 3) {
    score -= 1;
    reasons.push("Recent card activity suggests being selective");
  }

  return { score, reasons };
}

async function fetchProviderPage(provider: CardProvider): Promise<{ provider: CardProvider; html: string | null; pageTitle: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(provider.cardsUrl, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; OneCardBot/1.0; +https://onecard.local)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });
    if (!res.ok) return { provider, html: null, pageTitle: null };
    const html = await res.text();
    return { provider, html, pageTitle: extractTitle(html) };
  } catch {
    return { provider, html: null, pageTitle: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const profile = parseProfile(url);
  const providers = CARD_FINDER_PROVIDERS.filter((p) => p.region === "GLOBAL" || p.region === profile.region);

  const pages = await Promise.all(providers.map(fetchProviderPage));
  const offers: ScrapedOffer[] = [];

  for (const page of pages) {
    if (!page.html) continue;
    const candidates = extractOfferCandidates(page.html, page.provider.cardsUrl);
    for (const candidate of candidates) {
      const { score, reasons } = scoreOffer(candidate.title, profile);
      offers.push({
        providerId: page.provider.id,
        providerName: page.provider.name,
        title: candidate.title,
        url: candidate.url,
        score,
        reasons,
        details: candidate.details,
      });
    }
  }

  offers.sort((a, b) => b.score - a.score);

  return Response.json({
    fetchedAt: new Date().toISOString(),
    profile,
    providersChecked: providers.length,
    providersResponded: pages.filter((p) => !!p.html).length,
    offers: offers.slice(0, 40),
    notes: [
      "Offer data is scraped from public issuer pages and can change quickly.",
      "This is not financial advice; users should verify eligibility and terms on issuer sites.",
      "Credit score is optional and used only to tune recommendation fit for this request.",
      "Future profile inputs (income, utilization, delinquencies) can improve ranking accuracy.",
    ],
  });
}

