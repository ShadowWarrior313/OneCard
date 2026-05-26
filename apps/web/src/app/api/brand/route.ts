import {
  BrandfetchError,
  resolveBrandLogo,
  type LogoSurface,
} from "@/lib/brandfetch";

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

  try {
    const result = await resolveBrandLogo(domains, surface);
    if (!result) {
      return Response.json(
        { error: "No logo found for domain", src: null, domain: domains[0] },
        { status: 404 },
      );
    }

    return Response.json(result);
  } catch (err) {
    if (err instanceof BrandfetchError) {
      return Response.json(
        { error: err.message, code: err.code, src: null, domain: domains[0] },
        { status: err.status },
      );
    }

    return Response.json(
      { error: "Brand lookup failed", src: null, domain: domains[0] },
      { status: 500 },
    );
  }
}
