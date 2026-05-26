import { resolveBrandLogo, type LogoSurface } from "@/lib/brandfetch";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const primary = params.get("domain")?.trim().toLowerCase();
  const fallbacks = (params.get("fallback") ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const surface = (params.get("surface") === "light" ? "light" : "dark") as LogoSurface;

  const domains = [...new Set([primary, ...fallbacks].filter(Boolean))] as string[];
  const domainPattern = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!domains.length || !domains.every((d) => domainPattern.test(d))) {
    return Response.json({ error: "Invalid domain", src: null }, { status: 400 });
  }

  if (!process.env.BRANDFETCH_KEY) {
    return Response.json({ error: "Brandfetch not configured", src: null }, { status: 503 });
  }

  const result = await resolveBrandLogo(domains, surface);
  if (!result) {
    return Response.json({ src: null, domain: domains[0] }, { status: 404 });
  }

  return Response.json(result);
}
