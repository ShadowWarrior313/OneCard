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
  { id: "wealthsimple", name: "Wealthsimple", region: "CA", cardsUrl: "https://www.wealthsimple.com/en-ca/spend" },
  { id: "rbc", name: "RBC", region: "CA", cardsUrl: "https://www.rbcroyalbank.com/credit-cards/index.html" },
  { id: "td", name: "TD", region: "CA", cardsUrl: "https://www.td.com/ca/en/personal-banking/products/credit-cards" },
  { id: "cibc", name: "CIBC", region: "CA", cardsUrl: "https://www.cibc.com/en/personal-banking/credit-cards.html" },
  { id: "scotiabank", name: "Scotiabank", region: "CA", cardsUrl: "https://www.scotiabank.com/ca/en/personal/credit-cards.html" },
  { id: "bmo", name: "BMO", region: "CA", cardsUrl: "https://www.bmo.com/main/personal/credit-cards/" },
  { id: "chase", name: "Chase", region: "US", cardsUrl: "https://creditcards.chase.com/" },
  { id: "boa", name: "Bank of America", region: "US", cardsUrl: "https://www.bankofamerica.com/credit-cards/" },
  { id: "capitalone", name: "Capital One", region: "US", cardsUrl: "https://www.capitalone.com/credit-cards/" },
  { id: "citi", name: "Citi", region: "US", cardsUrl: "https://www.citi.com/credit-cards" },
];

