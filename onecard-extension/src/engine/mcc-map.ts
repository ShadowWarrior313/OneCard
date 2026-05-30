export type MccCandidate = {
  mcc: string;
  confidence: number;
  reason: string;
};

export type MerchantMccEntry = {
  merchantId: string;
  displayName: string;
  domains: string[];
  candidates: MccCandidate[];
};

export const MERCHANT_MCC_MAP: MerchantMccEntry[] = [
  {
    merchantId: "walmart",
    displayName: "Walmart",
    domains: ["walmart.com", "walmart.ca"],
    candidates: [
      {
        mcc: "5411",
        confidence: 0.72,
        reason: "Walmart grocery checkout commonly rewards as grocery/supermarket.",
      },
      {
        mcc: "5310",
        confidence: 0.28,
        reason: "General Walmart merchandise can code as discount/retail.",
      },
    ],
  },
  {
    merchantId: "amazon",
    displayName: "Amazon",
    domains: ["amazon.com", "amazon.ca"],
    candidates: [
      {
        mcc: "5942",
        confidence: 0.62,
        reason: "Amazon retail purchases often map to bookstore/retail-like ecommerce MCCs.",
      },
      {
        mcc: "5999",
        confidence: 0.38,
        reason: "Marketplace and mixed carts may fall back to miscellaneous retail.",
      },
    ],
  },
  {
    merchantId: "loblaws",
    displayName: "Loblaws",
    domains: ["loblaws.ca"],
    candidates: [
      {
        mcc: "5411",
        confidence: 0.95,
        reason: "Loblaws is a grocery/supermarket merchant.",
      },
    ],
  },
  {
    merchantId: "stripe_test",
    displayName: "Stripe test checkout",
    domains: ["localhost"],
    candidates: [
      {
        mcc: "5999",
        confidence: 0.5,
        reason: "Generic checkout with no known merchant mapping.",
      },
    ],
  },
];

export function merchantMccForHost(hostname: string): MerchantMccEntry | null {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return (
    MERCHANT_MCC_MAP.find((entry) =>
      entry.domains.some((domain) => host === domain || host.endsWith(`.${domain}`)),
    ) ?? null
  );
}

export function merchantMccForIdentity(
  merchantId: string,
  hostname: string,
  displayName?: string,
): MerchantMccEntry {
  const normalizedId = merchantId.toLowerCase();
  const byId = MERCHANT_MCC_MAP.find((entry) => entry.merchantId === normalizedId);
  if (byId) return byId;
  return merchantMccForHost(hostname) ?? fallbackMerchantForHost(hostname, displayName);
}

export function fallbackMerchantForHost(hostname: string, displayName?: string): MerchantMccEntry {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return {
    merchantId: host.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown",
    displayName: displayName || host || "Unknown merchant",
    domains: [host],
    candidates: [
      {
        mcc: "5999",
        confidence: 0.35,
        reason: "No curated MCC mapping yet, so OneCard uses a conservative miscellaneous retail fallback.",
      },
    ],
  };
}
