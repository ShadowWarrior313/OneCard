export type BrandfetchLogoTheme = "light" | "dark";
export type BrandfetchLogoType = "icon" | "logo" | "symbol";

/** Logo API client ID — public, embedded in img URLs per Brandfetch docs. */
export function getBrandfetchClientId(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID?.trim() ||
    process.env.BRANDFETCH_CLIENT_ID?.trim() ||
    undefined
  );
}

/**
 * Build a Logo API CDN URL (free tier — does not use Brand API quota).
 * @see https://docs.brandfetch.com/logo-api/overview
 */
export function brandfetchLogoUrl(
  domain: string,
  options?: {
    theme?: BrandfetchLogoTheme;
    size?: number;
    type?: BrandfetchLogoType;
  },
): string | null {
  const clientId = getBrandfetchClientId();
  if (!clientId) return null;

  const theme = options?.theme ?? "light";
  const size = options?.size ?? 128;
  const type = options?.type ?? "icon";
  const host = domain.trim().toLowerCase();
  if (!host) return null;

  const params = new URLSearchParams({ c: clientId });
  return `https://cdn.brandfetch.io/${encodeURIComponent(host)}/w/${size}/h/${size}/theme/${theme}/fallback/404/${type}?${params}`;
}

export function brandfetchLogoUrls(
  domains: string[],
  options?: {
    theme?: BrandfetchLogoTheme;
    size?: number;
    type?: BrandfetchLogoType;
  },
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const domain of domains) {
    const url = brandfetchLogoUrl(domain, options);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }

  return urls;
}
