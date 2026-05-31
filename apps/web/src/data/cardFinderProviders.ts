export type ProviderRegion = "CA" | "US" | "GLOBAL";

export type CardProvider = {
  id: string;
  name: string;
  region: ProviderRegion;
  cardsUrl: string;
};

/** Primary pages used by Card Finder scraping. */
export const CARD_FINDER_PROVIDERS: CardProvider[] = [
  { id: "amex", name: "American Express", region: "GLOBAL", cardsUrl: "https://www.americanexpress.com/en-ca/credit-cards/" },
  { id: "wealthsimple", name: "Wealthsimple", region: "CA", cardsUrl: "https://www.wealthsimple.com/en-ca/credit-card" },
  { id: "rbc", name: "RBC", region: "CA", cardsUrl: "https://www.rbcroyalbank.com/credit-cards/index.html" },
  { id: "td", name: "TD", region: "CA", cardsUrl: "https://www.td.com/ca/en/personal-banking/products/credit-cards" },
  { id: "cibc", name: "CIBC", region: "CA", cardsUrl: "https://www.cibc.com/en/personal-banking/credit-cards.html" },
  { id: "scotiabank", name: "Scotiabank", region: "CA", cardsUrl: "https://www.scotiabank.com/ca/en/personal/credit-cards.html" },
  { id: "bmo", name: "BMO", region: "CA", cardsUrl: "https://www.bmo.com/main/personal/credit-cards/" },
  { id: "national-bank", name: "National Bank", region: "CA", cardsUrl: "https://www.nbc.ca/personal/accounts/credit-cards.html" },
  { id: "desjardins", name: "Desjardins", region: "CA", cardsUrl: "https://www.desjardins.com/ca/personal/loans-credit/credit-cards/index.jsp" },
  { id: "rogers-bank", name: "Rogers Bank", region: "CA", cardsUrl: "https://www.rogersbank.com/en/credit_cards" },
  { id: "simplii", name: "Simplii Financial", region: "CA", cardsUrl: "https://www.simplii.com/en/credit-cards.html" },
  { id: "pc-financial", name: "PC Financial", region: "CA", cardsUrl: "https://www.pcfinancial.ca/en/credit-cards/" },
  { id: "mbna", name: "MBNA", region: "CA", cardsUrl: "https://www.mbna.ca/en/credit-cards" },
  { id: "canadian-tire", name: "Canadian Tire Bank", region: "CA", cardsUrl: "https://triangle.canadiantire.ca/en/credit-cards.html" },
  { id: "chase", name: "Chase", region: "US", cardsUrl: "https://creditcards.chase.com/" },
  { id: "boa", name: "Bank of America", region: "US", cardsUrl: "https://www.bankofamerica.com/credit-cards/" },
  { id: "capitalone", name: "Capital One", region: "US", cardsUrl: "https://www.capitalone.com/credit-cards/" },
  { id: "citi", name: "Citi", region: "US", cardsUrl: "https://www.citi.com/credit-cards" },
  { id: "wells-fargo", name: "Wells Fargo", region: "US", cardsUrl: "https://creditcards.wellsfargo.com/" },
  { id: "us-bank", name: "U.S. Bank", region: "US", cardsUrl: "https://www.usbank.com/credit-cards.html" },
  { id: "discover", name: "Discover", region: "US", cardsUrl: "https://www.discover.com/credit-cards/" },
];
