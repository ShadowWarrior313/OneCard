/** Brandfetch v2 brand payload (subset we use). */
export interface BrandfetchLogoFormat {
  src: string;
  format?: string;
  width?: number;
  height?: number;
}

export interface BrandfetchLogo {
  type?: string;
  theme?: string;
  formats?: BrandfetchLogoFormat[];
}

export interface BrandfetchBrand {
  name?: string;
  domain?: string;
  logos?: BrandfetchLogo[];
}

export type LogoSurface = "dark" | "light";

const TYPE_PRIORITY = ["logo", "symbol", "icon"];

/** Prefer raster formats — Brandfetch SVG CDN links often 404 in browsers. */
function formatScore(f: BrandfetchLogoFormat): number {
  const fmt = (f.format ?? "").toLowerCase();
  if (fmt === "png") return 4;
  if (fmt === "jpeg" || fmt === "jpg") return 3;
  if (fmt === "webp") return 2;
  if (fmt === "svg") return 1;
  return 0;
}

function themeOrder(surface: LogoSurface): string[] {
  return surface === "dark" ? ["dark", "light"] : ["light", "dark"];
}

function bestFormat(formats: BrandfetchLogoFormat[]): BrandfetchLogoFormat | undefined {
  return [...formats].sort((a, b) => formatScore(b) - formatScore(a))[0];
}

/** Pick the best logo URL for the given background surface. */
export function pickLogoSrc(
  brand: BrandfetchBrand,
  surface: LogoSurface = "dark",
): string | null {
  const logos = brand.logos ?? [];
  if (!logos.length) return null;

  for (const type of TYPE_PRIORITY) {
    const matches = logos.filter((l) => l.type === type);
    if (!matches.length) continue;

    for (const theme of themeOrder(surface)) {
      const themed = matches.filter((l) => l.theme === theme);
      for (const logo of themed) {
        const best = bestFormat(logo.formats ?? []);
        if (best?.src) return best.src;
      }
    }

    for (const logo of matches) {
      const best = bestFormat(logo.formats ?? []);
      if (best?.src) return best.src;
    }
  }

  for (const logo of logos) {
    const best = bestFormat(logo.formats ?? []);
    if (best?.src) return best.src;
  }

  return null;
}

export type BrandfetchErrorCode =
  | "not_configured"
  | "quota_exceeded"
  | "not_found"
  | "upstream_error";

export class BrandfetchError extends Error {
  constructor(
    message: string,
    readonly code: BrandfetchErrorCode,
    readonly status: number,
  ) {
    super(message);
    this.name = "BrandfetchError";
  }
}

export async function fetchBrandFromApi(domain: string): Promise<BrandfetchBrand | null> {
  const key = process.env.BRANDFETCH_KEY;
  if (!key) {
    throw new BrandfetchError("Brandfetch not configured", "not_configured", 503);
  }

  const res = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`, {
    headers: { Authorization: `Bearer ${key}` },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (res.status === 429) {
    throw new BrandfetchError("Brandfetch API quota exceeded", "quota_exceeded", 429);
  }

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new BrandfetchError(
      `Brandfetch request failed (${res.status})`,
      "upstream_error",
      res.status,
    );
  }

  return (await res.json()) as BrandfetchBrand;
}

export async function resolveBrandLogo(
  domains: string[],
  surface: LogoSurface = "dark",
): Promise<{ domain: string; name: string; src: string } | null> {
  for (const domain of domains) {
    const brand = await fetchBrandFromApi(domain);
    if (!brand) continue;

    const src = pickLogoSrc(brand, surface);
    if (src) {
      return { domain, name: brand.name ?? domain, src };
    }
  }
  return null;
}
