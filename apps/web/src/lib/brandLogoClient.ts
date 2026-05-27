import {
  brandfetchLogoUrl,
  brandfetchLogoUrls,
  type BrandfetchLogoTheme,
} from "./brandfetchLogo";
import { logoDevLogoUrls } from "./logoDevLogo";
import { simpleIconCandidates } from "./simpleIcons";
import { vectorLogoZoneCandidates } from "./vectorLogoZone";

const brandLogoCache = new Map<string, string | null>();

export type BrandLogoContext = {
  merchantId?: string;
  issuer?: string;
};

function cacheKey(domains: string[], context?: BrandLogoContext): string {
  return [domains.join("|"), context?.merchantId ?? "", context?.issuer ?? ""].join("::");
}

export function brandLogoCacheKey(domains: string[]): string {
  return domains.join("|");
}

export function getCachedBrandLogo(
  domains: string[],
): string | null | undefined {
  const key = brandLogoCacheKey(domains);
  if (!brandLogoCache.has(key)) return undefined;
  return brandLogoCache.get(key) ?? null;
}

/** Primary logo URL — Logo.dev first, then local/CDN fallbacks. */
export function resolveBrandLogoUrl(
  domains: string[],
  surface: BrandfetchLogoTheme = "light",
  size = 128,
  context?: BrandLogoContext,
): string | null {
  const key = cacheKey(domains, context);
  if (brandLogoCache.has(key)) {
    return brandLogoCache.get(key) ?? null;
  }

  const urls = resolveBrandLogoCandidates(domains, surface, size, context);
  const src = urls[0] ?? null;
  brandLogoCache.set(key, src);
  return src;
}

/** All candidate URLs for onError retry (Logo.dev → local/CDN fallbacks). */
export function resolveBrandLogoCandidates(
  domains: string[],
  surface: BrandfetchLogoTheme = "light",
  size = 128,
  context?: BrandLogoContext,
): string[] {
  const logoDev = logoDevLogoUrls(domains, { theme: surface, size });
  const simple = simpleIconCandidates({
    domains,
    merchantId: context?.merchantId,
    issuer: context?.issuer,
  });
  const vectorZone = context?.issuer ? vectorLogoZoneCandidates(context.issuer) : [];
  const brandfetch = brandfetchLogoUrls(domains, { theme: surface, size });

  const seen = new Set<string>();
  const merged: string[] = [];
  for (const url of [...logoDev, ...simple, ...vectorZone, ...brandfetch]) {
    if (seen.has(url)) continue;
    seen.add(url);
    merged.push(url);
  }
  return merged;
}

/** @deprecated Use resolveBrandLogoUrl — kept for call-site compatibility. */
export async function fetchBrandLogo(
  domains: string[],
  surface: "light" | "dark" = "light",
): Promise<string | null> {
  return resolveBrandLogoUrl(domains, surface);
}

/** Direct URL for a single domain (e.g. API route). */
export function logoUrlForDomain(
  domain: string,
  surface: BrandfetchLogoTheme = "light",
  context?: BrandLogoContext,
): string | null {
  return resolveBrandLogoUrl([domain], surface, 128, context);
}
