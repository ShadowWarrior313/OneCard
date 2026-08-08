import { MERCHANT_PRESETS, type MerchantPreset } from "@/data/merchants";

/**
 * Resolve a hub/Plaid merchant string to a curated web-catalog brand.
 *
 * The MCC engine only knows a handful of merchants; the web catalog has the
 * full Canadian brand list the simulator already trusts. Matching here is what
 * lets hub rewards-intel score Loblaws/Tim Hortons/Shell/etc. instead of
 * failing open to base-rate `other`.
 */

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0] ?? d;
  const labels = d.split(".");
  if (labels.length > 2) return labels.slice(-2).join(".");
  return d;
}

/** True when `phrase` appears as a contiguous token sequence inside `name`. */
function phraseInName(name: string, phrase: string): boolean {
  if (!phrase) return false;
  return ` ${name} `.includes(` ${phrase} `);
}

function brandPhrases(merchant: MerchantPreset): string[] {
  return [
    merchant.name,
    merchant.shortName,
    merchant.id.replace(/_/g, " "),
    ...(merchant.searchAliases ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalize)
    .filter((phrase) => phrase.length >= 3);
}

type MatchCandidate = {
  merchant: MerchantPreset;
  phraseLen: number;
  /** 3 = primary name, 2 = shortName, 1 = id/alias — higher wins on ties. */
  quality: number;
};

function phraseQuality(merchant: MerchantPreset, phrase: string): number {
  if (normalize(merchant.name) === phrase) return 3;
  if (merchant.shortName && normalize(merchant.shortName) === phrase) return 2;
  return 1;
}

/**
 * Longest brand/alias phrase wins so "Uber Eats" beats "Uber".
 * On equal length, prefer a primary-name hit over a shortName collision
 * (e.g. "Walmart Supercentre" → walmart, not walmart_grocery via shortName).
 */
export function resolveHubMerchant(
  merchantName: string,
  website?: string,
): MerchantPreset | undefined {
  if (website) {
    const domain = normalizeDomain(website);
    const byDomain = MERCHANT_PRESETS.find(
      (merchant) =>
        merchant.kind === "brand" &&
        (merchant.logoDomain === domain ||
          merchant.logoDomainFallbacks?.includes(domain)),
    );
    if (byDomain) return byDomain;
  }

  const name = normalize(merchantName);
  if (!name) return undefined;

  let best: MatchCandidate | undefined;
  for (const merchant of MERCHANT_PRESETS) {
    if (merchant.kind !== "brand") continue;
    for (const phrase of brandPhrases(merchant)) {
      if (!phraseInName(name, phrase)) continue;
      const candidate: MatchCandidate = {
        merchant,
        phraseLen: phrase.length,
        quality: phraseQuality(merchant, phrase),
      };
      if (
        !best ||
        candidate.phraseLen > best.phraseLen ||
        (candidate.phraseLen === best.phraseLen && candidate.quality > best.quality)
      ) {
        best = candidate;
      }
    }
  }
  return best?.merchant;
}

export function resolveHubMerchantId(
  merchantName: string,
  website?: string,
): string | undefined {
  return resolveHubMerchant(merchantName, website)?.id;
}
