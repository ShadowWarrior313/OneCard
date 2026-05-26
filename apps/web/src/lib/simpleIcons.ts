import {
  SIMPLE_ICON_DOMAIN_SLUGS,
  SIMPLE_ICON_ISSUER_SLUGS,
  SIMPLE_ICON_MERCHANT_SLUGS,
} from "@/data/simpleIconSlugs";

const SIMPLE_ICONS_CDN = "https://cdn.simpleicons.org";
const SIMPLE_ICONS_JSdelivr = "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons";

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^www\./, "");
}

export function simpleIconSlugForDomain(domain: string): string | null {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;
  return SIMPLE_ICON_DOMAIN_SLUGS[normalized] ?? null;
}

export function simpleIconSlugForMerchant(merchantId: string): string | null {
  return SIMPLE_ICON_MERCHANT_SLUGS[merchantId] ?? null;
}

export function simpleIconSlugForIssuer(issuer: string): string | null {
  return SIMPLE_ICON_ISSUER_SLUGS[issuer] ?? null;
}

/** Brand-colored icon from the official Simple Icons CDN. */
export function simpleIconUrl(slug: string): string {
  return `${SIMPLE_ICONS_CDN}/${encodeURIComponent(slug)}`;
}

/** Monochrome SVG fallback from jsDelivr (same icon set). */
export function simpleIconSvgUrl(slug: string): string {
  return `${SIMPLE_ICONS_JSdelivr}/${encodeURIComponent(slug)}.svg`;
}

export function collectSimpleIconSlugs(input: {
  domains?: string[];
  merchantId?: string;
  issuer?: string;
}): string[] {
  const slugs = new Set<string>();

  if (input.merchantId) {
    const merchantSlug = simpleIconSlugForMerchant(input.merchantId);
    if (merchantSlug) slugs.add(merchantSlug);
  }

  if (input.issuer) {
    const issuerSlug = simpleIconSlugForIssuer(input.issuer);
    if (issuerSlug) slugs.add(issuerSlug);
  }

  for (const domain of input.domains ?? []) {
    const slug = simpleIconSlugForDomain(domain);
    if (slug) slugs.add(slug);
  }

  return [...slugs];
}

export function simpleIconCandidates(input: {
  domains?: string[];
  merchantId?: string;
  issuer?: string;
}): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const slug of collectSimpleIconSlugs(input)) {
    for (const url of [simpleIconUrl(slug), simpleIconSvgUrl(slug)]) {
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}
