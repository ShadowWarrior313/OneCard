/**
 * Domain → Simple Icons slug mappings.
 * @see https://github.com/simple-icons/simple-icons
 * @see https://cdn.simpleicons.org/
 */
export const SIMPLE_ICON_DOMAIN_SLUGS: Record<string, string> = {
  // Issuers & networks
  "americanexpress.com": "americanexpress",
  "amex.com": "americanexpress",
  "wealthsimple.com": "wealthsimple",
  "mastercard.com": "mastercard",
  "visa.com": "visa",

  // Groceries
  "costco.ca": "costco",
  "costco.com": "costco",
  "walmart.ca": "walmart",
  "walmart.com": "walmart",
  "wholefoodsmarket.com": "wholefoodsmarket",
  "kroger.com": "kroger",
  "safeway.com": "safeway",
  "publix.com": "publix",
  "traderjoes.com": "traderjoes",
  "albertsons.com": "albertsons",
  "instacart.com": "instacart",

  // Food & drink
  "ubereats.com": "ubereats",
  "uber.com": "uber",
  "timhortons.com": "timhortons",
  "timhortons.ca": "timhortons",
  "starbucks.com": "starbucks",
  "starbucks.ca": "starbucks",
  "mcdonalds.com": "mcdonalds",
  "mcdonalds.ca": "mcdonalds",
  "doordash.com": "doordash",
  "subway.com": "subway",
  "wendys.com": "wendys",
  "chipotle.com": "chipotle",
  "popeyes.com": "popeyes",
  "dunkindonuts.com": "dunkin",
  "panerabread.com": "panera",
  "kfc.com": "kfc",
  "kfc.ca": "kfc",
  "burgerking.com": "burgerking",
  "burgerking.ca": "burgerking",
  "tacobell.com": "tacobell",
  "tacobell.ca": "tacobell",
  "dominos.com": "dominos",
  "dominos.ca": "dominos",
  "pizzahut.com": "pizzahut",
  "pizzahut.ca": "pizzahut",
  "fiveguys.com": "fiveguys",
  "fiveguys.ca": "fiveguys",
  "olivegarden.com": "olivegarden",
  "jollibee.com": "jollibee",
  "jollibee.ca": "jollibee",
  "auntieannes.com": "auntieannes",
  "nandos.com": "nandos",
  "nandos.ca": "nandos",

  // Travel
  "aircanada.com": "aircanada",
  "westjet.com": "westjet",
  "marriott.com": "marriott",
  "expedia.com": "expedia",
  "expedia.ca": "expedia",
  "airbnb.com": "airbnb",
  "airbnb.ca": "airbnb",
  "booking.com": "bookingdotcom",
  "delta.com": "delta",
  "united.com": "united",
  "hertz.com": "hertz",
  "enterprise.com": "enterprise",
  "hilton.com": "hilton",

  // Gas
  "shell.com": "shell",
  "shell.ca": "shell",
  "chevron.com": "chevron",
  "bp.com": "bp",
  "exxon.com": "exxonmobil",
  "circlek.com": "circlek",

  // Shopping
  "amazon.com": "amazon",
  "amazon.ca": "amazon",
  "canadiantire.ca": "canadiantire",
  "bestbuy.com": "bestbuy",
  "bestbuy.ca": "bestbuy",
  "ikea.com": "ikea",
  "homedepot.com": "homedepot",
  "homedepot.ca": "homedepot",
  "lowes.com": "lowes",
  "lowes.ca": "lowes",
  "apple.com": "apple",
  "nike.com": "nike",
  "target.com": "target",
  "staples.com": "staples",
  "staples.ca": "staples",

  // Subscriptions & telecom
  "spotify.com": "spotify",
  "netflix.com": "netflix",
  "disneyplus.com": "disneyplus",
  "youtube.com": "youtube",
  "adobe.com": "adobe",
  "microsoft.com": "microsoft",
  "verizon.com": "verizon",
  "att.com": "att",
  "t-mobile.com": "tmobile",

  // Entertainment
  "steampowered.com": "steam",
  "xbox.com": "xbox",
  "playstation.com": "playstation",
  "ticketmaster.com": "ticketmaster",
  "ticketmaster.ca": "ticketmaster",
  "ea.com": "ea",
  "amctheatres.com": "amc",

  // Health
  "cvs.com": "cvs",
  "walgreens.com": "walgreens",
  "onepeloton.com": "peloton",

  // Transportation
  "lyft.com": "lyft",

  // Education
  "coursera.org": "coursera",
  "udemy.com": "udemy",
  "linkedin.com": "linkedin",
  "khanacademy.org": "khanacademy",

  // Other
  "paypal.com": "paypal",
  "venmo.com": "venmo",
};

/** Merchant id overrides when domain mapping is missing or wrong. */
export const SIMPLE_ICON_MERCHANT_SLUGS: Record<string, string> = {
  uber_eats: "ubereats",
  skip: "skipthedishes",
  disney_plus: "disneyplus",
  youtube_premium: "youtube",
  microsoft_365: "microsoft",
  apple_store: "apple",
  apple_tv: "apple",
  playstation: "playstation",
  tmobile: "tmobile",
  att: "att",
  whole_foods: "wholefoodsmarket",
  trader_joes: "traderjoes",
  burger_king: "burgerking",
  taco_bell: "tacobell",
  pizza_hut: "pizzahut",
  dunkin: "dunkin",
  auntie_annes: "auntieannes",
  booking: "bookingdotcom",
  exxon: "exxonmobil",
  amazon_us: "amazon",
  amazon_prime: "amazon",
};

/** Issuer name → Simple Icons slug (financial brands in the library). */
export const SIMPLE_ICON_ISSUER_SLUGS: Record<string, string> = {
  "American Express": "americanexpress",
  Amex: "americanexpress",
};
