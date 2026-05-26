/**
 * Canadian / issuer logos from Vector Logo Zone (open source).
 * @see https://github.com/VectorLogoZone/vectorlogo.zone
 */
export const VECTOR_LOGO_ZONE_ISSUER_SLUGS: Record<string, string> = {
  TD: "tdbank",
  CIBC: "cibc",
  RBC: "rbcroyalbank",
  Scotiabank: "scotiabank",
};

export type VectorLogoVariant = "icon" | "ar21";

export function vectorLogoZoneUrl(
  slug: string,
  variant: VectorLogoVariant = "icon",
): string {
  return `https://www.vectorlogo.zone/logos/${slug}/${slug}-${variant}.svg`;
}

export function vectorLogoZoneCandidates(issuer: string): string[] {
  const slug = VECTOR_LOGO_ZONE_ISSUER_SLUGS[issuer];
  if (!slug) return [];
  return [vectorLogoZoneUrl(slug, "icon"), vectorLogoZoneUrl(slug, "ar21")];
}
