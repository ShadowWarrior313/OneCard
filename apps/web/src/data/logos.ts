/** Local brand assets in /public/logos */

export const ISSUER_LOGOS: Record<string, string> = {
  "American Express": "/logos/amex.png",
  Amex: "/logos/amex.png",
  TD: "/logos/td.png",
  CIBC: "/logos/cibc.png",
  Scotiabank: "/logos/scotiabank.png",
  RBC: "/logos/rbc.png",
};

export const MERCHANT_LOGOS: Record<string, string> = {
  uber_eats: "/logos/uber-eats.png",
  amazon: "/logos/amazon.png",
  netflix: "/logos/netflix.png",
};

export function issuerLogoSrc(issuer: string): string | undefined {
  return ISSUER_LOGOS[issuer];
}

export function merchantLogoSrc(merchantId: string): string | undefined {
  return MERCHANT_LOGOS[merchantId];
}
