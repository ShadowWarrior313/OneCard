import {
  brandfetchLogoUrl,
  brandfetchLogoUrls,
  type BrandfetchLogoTheme,
} from "./brandfetchLogo";

const brandLogoCache = new Map<string, string | null>();

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

/** Primary logo URL for a domain list (Logo API CDN — no Brand API quota). */
export function resolveBrandLogoUrl(
  domains: string[],
  surface: BrandfetchLogoTheme = "light",
  size = 128,
): string | null {
  const key = brandLogoCacheKey(domains);
  if (brandLogoCache.has(key)) {
    return brandLogoCache.get(key) ?? null;
  }

  const urls = brandfetchLogoUrls(domains, { theme: surface, size });
  const src = urls[0] ?? null;
  brandLogoCache.set(key, src);
  return src;
}

/** All candidate CDN URLs (primary + fallbacks) for onError retry. */
export function resolveBrandLogoCandidates(
  domains: string[],
  surface: BrandfetchLogoTheme = "light",
  size = 128,
): string[] {
  return brandfetchLogoUrls(domains, { theme: surface, size });
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
): string | null {
  return brandfetchLogoUrl(domain, { theme: surface });
}
