type IssuerDomainEntry = {
  domain: string;
  fallbacks?: string[];
};

export const ISSUER_DOMAINS: Record<string, IssuerDomainEntry> = {
  "American Express": {
    domain: "americanexpress.com",
    fallbacks: ["amex.com"],
  },
  Amex: {
    domain: "americanexpress.com",
    fallbacks: ["amex.com"],
  },
  TD: { domain: "td.com" },
  CIBC: { domain: "cibc.com" },
  RBC: { domain: "rbcroyalbank.com", fallbacks: ["rbc.com"] },
  Scotiabank: { domain: "scotiabank.com" },
  BMO: { domain: "bmo.com" },
  "National Bank": { domain: "nbc.ca", fallbacks: ["nationalbank.ca"] },
  "Simplii Financial": { domain: "simplii.com" },
  Wealthsimple: { domain: "wealthsimple.com" },
  "PC Financial": { domain: "pcfinancial.ca" },
  "Neo Financial": { domain: "neofinancial.com" },
  Tangerine: { domain: "tangerine.ca" },
  KOHO: { domain: "koho.ca" },
  Manulife: { domain: "manulife.ca" },
};

export function issuerBrandDomains(issuer: string): string[] {
  const entry = ISSUER_DOMAINS[issuer];
  if (!entry) return [];
  return [...new Set([entry.domain, ...(entry.fallbacks ?? [])])];
}
