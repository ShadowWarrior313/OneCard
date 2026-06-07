import type { ProviderAccount, ProviderTransaction } from "../types";

/**
 * Fully local fixtures for the mock provider. Zero network, zero secrets — this
 * is what makes the hub demoable and testable WITHOUT Plaid. Merchant names are
 * chosen so the MCC engine produces a realistic spread of reward categories.
 */
export const MOCK_INSTITUTION = "OneCard Sandbox Bank";

export const MOCK_ACCOUNTS: ProviderAccount[] = [
  {
    providerAccountId: "mock_acct_credit",
    name: "Everyday Rewards Card",
    officialName: "OneCard Sandbox Rewards Visa",
    mask: "4291",
    type: "credit",
    subtype: "credit card",
  },
  {
    providerAccountId: "mock_acct_checking",
    name: "Everyday Chequing",
    mask: "0117",
    type: "depository",
    subtype: "checking",
  },
];

/** Merchant, amount, provider's (deliberately generic) category hint, days-ago. */
const SEED: Array<[string, number, string, number, string?]> = [
  ["Safeway", 84.2, "FOOD_AND_DRINK", 2],
  ["Walmart Supercentre", 132.5, "GENERAL_MERCHANDISE", 4],
  ["Shell", 61.0, "TRANSPORTATION", 5, "shell.ca"],
  ["Marriott Hotels", 312.4, "TRAVEL", 7, "marriott.com"],
  ["Tim Hortons", 9.85, "FOOD_AND_DRINK", 1],
  ["Costco Wholesale", 248.13, "GENERAL_MERCHANDISE", 9],
  ["Shoppers Drug Mart", 41.6, "MEDICAL", 6],
  ["Air Canada", 489.0, "TRAVEL", 12, "aircanada.com"],
  ["Netflix", 20.99, "ENTERTAINMENT", 3, "netflix.com"],
  ["The Keg Steakhouse", 156.7, "FOOD_AND_DRINK", 8],
];

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Build a deterministic-ish batch of transactions dated within the last ~2 weeks. */
export function mockTransactions(): ProviderTransaction[] {
  return SEED.map(([merchantName, amount, hint, daysAgo, website], index) => ({
    providerTransactionId: `mock_txn_${index}`,
    providerAccountId: MOCK_ACCOUNTS[0].providerAccountId,
    merchantName,
    amount,
    isoCurrencyCode: "CAD",
    date: isoDaysAgo(daysAgo),
    pending: false,
    paymentChannel: website ? "online" : "in store",
    website,
    providerCategoryHint: hint,
  }));
}
