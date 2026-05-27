export type LogoDevTheme = "light" | "dark";

const LOGODEV_FALLBACK_TOKEN = "pk_RuhNJ-aCTG20CfcjLge94g";

export function getLogoDevToken(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_LOGODEV_TOKEN?.trim() ||
    process.env.LOGODEV_TOKEN?.trim() ||
    LOGODEV_FALLBACK_TOKEN
  );
}

export function logoDevLogoUrl(
  domain: string,
  options?: {
    size?: number;
    theme?: LogoDevTheme;
  },
): string | null {
  const token = getLogoDevToken();
  const host = domain.trim().toLowerCase().replace(/^www\./, "");
  if (!token || !host) return null;

  const params = new URLSearchParams({
    token,
    size: String(options?.size ?? 128),
    format: "webp",
    fallback: "404",
  });

  const theme = options?.theme;
  if (theme === "dark") params.set("theme", "dark");

  return `https://img.logo.dev/${encodeURIComponent(host)}?${params.toString()}`;
}

export function logoDevLogoUrls(
  domains: string[],
  options?: {
    size?: number;
    theme?: LogoDevTheme;
  },
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const domain of domains) {
    const url = logoDevLogoUrl(domain, options);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }

  return urls;
}
