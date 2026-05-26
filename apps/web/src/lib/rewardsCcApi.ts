const RAPIDAPI_HOST = "rewards-credit-card-api.p.rapidapi.com";
const API_BASE = `https://${RAPIDAPI_HOST}`;

export interface CardImageRecord {
  cardKey: string;
  cardName: string;
  cardImageUrl: string;
}

export interface CardNameSearchRecord {
  cardKey: string;
  cardName: string;
  cardIssuer: string;
}

function apiHeaders(): HeadersInit | null {
  const key = process.env.REWARDS_CC_RAPIDAPI_KEY?.trim();
  if (!key) return null;
  return {
    "x-rapidapi-key": key,
    "x-rapidapi-host": RAPIDAPI_HOST,
  };
}

export function isRewardsCcConfigured(): boolean {
  return Boolean(process.env.REWARDS_CC_RAPIDAPI_KEY?.trim());
}

async function rewardsCcFetch<T>(path: string): Promise<T | null> {
  const headers = apiHeaders();
  if (!headers) return null;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchCardImageByKey(
  cardKey: string,
): Promise<CardImageRecord | null> {
  const data = await rewardsCcFetch<CardImageRecord[]>(
    `/creditcard-card-image/${encodeURIComponent(cardKey)}`,
  );
  const record = data?.[0];
  if (!record?.cardImageUrl) return null;
  return record;
}

export async function searchCardsByName(
  query: string,
): Promise<CardNameSearchRecord[]> {
  const trimmed = query.trim();
  if (trimmed.length < 4) return [];
  const data = await rewardsCcFetch<CardNameSearchRecord[]>(
    `/creditcard-detail-namesearch/${encodeURIComponent(trimmed)}`,
  );
  return data ?? [];
}

const ISSUER_ALIASES: Record<string, string[]> = {
  "American Express": ["american express", "amex"],
  TD: ["td", "td bank"],
  CIBC: ["cibc"],
  RBC: ["rbc", "royal bank"],
  Scotiabank: ["scotiabank", "scotia"],
  BMO: ["bmo", "bank of montreal"],
  "National Bank": ["national bank", "nbc"],
  "Simplii Financial": ["simplii"],
  Wealthsimple: ["wealthsimple"],
  "PC Financial": ["pc financial", "presidents choice"],
  "Neo Financial": ["neo"],
  Tangerine: ["tangerine"],
  KOHO: ["koho"],
  Manulife: ["manulife"],
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/®|™|©/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function issuerMatches(resultIssuer: string, issuer: string): boolean {
  const normalizedResult = normalizeText(resultIssuer);
  const aliases = ISSUER_ALIASES[issuer] ?? [normalizeText(issuer)];
  return aliases.some(
    (alias) =>
      normalizedResult.includes(alias) || alias.includes(normalizedResult),
  );
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(normalizeText(a).split(" ").filter((t) => t.length > 2));
  const bTokens = normalizeText(b).split(" ").filter((t) => t.length > 2);
  return bTokens.filter((token) => aTokens.has(token)).length;
}

export function pickBestSearchResult(
  results: CardNameSearchRecord[],
  issuer: string,
  displayName: string,
): CardNameSearchRecord | null {
  if (!results.length) return null;

  const scored = results
    .map((result) => {
      let score = tokenOverlap(displayName, result.cardName) * 3;
      if (issuerMatches(result.cardIssuer, issuer)) score += 8;
      if (normalizeText(result.cardName) === normalizeText(displayName)) {
        score += 12;
      }
      return { result, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 4) return null;
  return best.result;
}
