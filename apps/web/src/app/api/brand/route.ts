import {
  getBrandfetchClientId,
  type BrandfetchLogoTheme,
} from "@/lib/brandfetchLogo";
import { logoUrlForDomain } from "@/lib/brandLogoClient";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const primary = params.get("domain")?.trim().toLowerCase();
  const fallbacks = (params.get("fallback") ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const surface = (
    params.get("surface") === "dark" ? "dark" : "light"
  ) as BrandfetchLogoTheme;

  const domains = [...new Set([primary, ...fallbacks].filter(Boolean))] as string[];
  const domainPattern = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!domains.length || !domains.every((d) => domainPattern.test(d))) {
    return Response.json({ error: "Invalid domain", src: null }, { status: 400 });
  }

  if (!getBrandfetchClientId()) {
    return Response.json(
      {
        error: "Brandfetch Logo API not configured — set NEXT_PUBLIC_BRANDFETCH_CLIENT_ID",
        code: "not_configured",
        src: null,
      },
      { status: 503 },
    );
  }

  for (const domain of domains) {
    const src = logoUrlForDomain(domain, surface);
    if (src) {
      return Response.json({ domain, name: domain, src });
    }
  }

  return Response.json(
    { error: "Could not build logo URL", src: null, domain: domains[0] },
    { status: 404 },
  );
}
