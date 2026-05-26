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

export async function fetchBrandLogo(
  domains: string[],
  surface: "light" | "dark" = "light",
): Promise<string | null> {
  const key = brandLogoCacheKey(domains);
  if (brandLogoCache.has(key)) {
    return brandLogoCache.get(key) ?? null;
  }

  try {
    const [primary, ...fallback] = domains;
    if (!primary) return null;

    const qs = new URLSearchParams({
      domain: primary,
      surface,
    });
    if (fallback.length) qs.set("fallback", fallback.join(","));

    const res = await fetch(`/api/brand?${qs}`);
    const data = (await res.json()) as { src?: string | null };
    const src = data.src ?? null;
    brandLogoCache.set(key, src);
    return src;
  } catch {
    brandLogoCache.set(key, null);
    return null;
  }
}
