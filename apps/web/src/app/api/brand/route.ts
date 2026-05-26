import { vectorLogoZoneCandidates } from "@/lib/vectorLogoZone";
import { brandfetchLogoUrl } from "@/lib/brandfetchLogo";
import { simpleIconCandidates } from "@/lib/simpleIcons";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const primary = params.get("domain")?.trim().toLowerCase();
  const fallbacks = (params.get("fallback") ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const merchantId = params.get("merchantId")?.trim() || undefined;
  const issuer = params.get("issuer")?.trim() || undefined;

  const domains = [...new Set([primary, ...fallbacks].filter(Boolean))] as string[];
  const domainPattern = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!domains.length || !domains.every((d) => domainPattern.test(d))) {
    return Response.json({ error: "Invalid domain", src: null }, { status: 400 });
  }

  const simple = simpleIconCandidates({ domains, merchantId, issuer });
  if (simple[0]) {
    return Response.json({
      domain: domains[0],
      name: domains[0],
      src: simple[0],
      source: "simple-icons",
    });
  }

  const vectorZone = issuer ? vectorLogoZoneCandidates(issuer) : [];
  if (vectorZone[0]) {
    return Response.json({
      domain: domains[0],
      name: domains[0],
      src: vectorZone[0],
      source: "vector-logo-zone",
    });
  }

  for (const domain of domains) {
    const src = brandfetchLogoUrl(domain, { theme: "light" });
    if (src) {
      return Response.json({ domain, name: domain, src, source: "brandfetch" });
    }
  }

  return Response.json(
    { error: "No logo found", src: null, domain: domains[0] },
    { status: 404 },
  );
}
