import type { RewardCategory } from "@onecard/shared-types";
import type { MerchantAvailability } from "./merchantAvailability";

/** Brand-only entries merged into the merchant catalog at build time. */
export type MerchantBrandDef = {
  id: string;
  name: string;
  shortName?: string;
  mcc: string;
  category: RewardCategory;
  group:
    | "Groceries"
    | "Food & drink"
    | "Travel"
    | "Entertainment"
    | "Gas"
    | "Shopping"
    | "Subscriptions"
    | "Health & pharmacy"
    | "Transportation"
    | "Education"
    | "Home & utilities"
    | "Other";
  logoDomain?: string;
  logoDomainFallbacks?: string[];
  /** Extra terms users might type, e.g. "panera" for Panera Bread */
  searchAliases?: string[];
  /** Restrict to specific countries / regions. Omit = worldwide. */
  availability?: MerchantAvailability;
};

export const MERCHANT_BRAND_DEFS: MerchantBrandDef[] = [
  // Groceries
  { id: "loblaws", name: "Loblaws", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "loblaws.ca" },
  { id: "metro", name: "Metro", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "metro.ca" },
  { id: "costco", name: "Costco", mcc: "5300", category: "groceries", group: "Groceries", logoDomain: "costco.ca" },
  { id: "sobeys", name: "Sobeys", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "sobeys.com" },
  { id: "walmart_grocery", name: "Walmart Grocery", shortName: "Walmart", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "walmart.ca" },
  { id: "no_frills", name: "No Frills", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "nofrills.ca" },
  { id: "superstore", name: "Real Canadian Superstore", shortName: "Superstore", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "realcanadiansuperstore.ca" },
  { id: "whole_foods", name: "Whole Foods", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "wholefoodsmarket.com" },
  { id: "iga", name: "IGA", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "iga.net" },
  { id: "save_on_foods", name: "Save-On-Foods", shortName: "Save-On", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "saveonfoods.com" },
  { id: "farm_boy", name: "Farm Boy", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "farmboy.ca" },
  { id: "longos", name: "Longo's", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "longos.com" },
  { id: "food_basics", name: "Food Basics", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "foodbasics.ca" },
  { id: "freshco", name: "FreshCo", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "freshco.com" },
  { id: "kroger", name: "Kroger", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "kroger.com" },
  { id: "safeway", name: "Safeway", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "safeway.com" },
  { id: "trader_joes", name: "Trader Joe's", shortName: "Trader Joe's", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "traderjoes.com" },
  { id: "publix", name: "Publix", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "publix.com" },
  { id: "albertsons", name: "Albertsons", mcc: "5411", category: "groceries", group: "Groceries", logoDomain: "albertsons.com" },

  // Food & drink
  { id: "uber_eats", name: "Uber Eats", shortName: "Uber Eats", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "ubereats.com" },
  { id: "tim_hortons", name: "Tim Hortons", shortName: "Tims", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "timhortons.com", logoDomainFallbacks: ["timhortons.ca"] },
  { id: "starbucks", name: "Starbucks", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "starbucks.ca", logoDomainFallbacks: ["starbucks.com"] },
  { id: "mcdonalds", name: "McDonald's", shortName: "McDonald's", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "mcdonalds.ca", logoDomainFallbacks: ["mcdonalds.com"] },
  { id: "doordash", name: "DoorDash", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "doordash.com" },
  { id: "skip", name: "SkipTheDishes", shortName: "Skip", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "skipthedishes.com" },
  { id: "subway", name: "Subway", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "subway.com" },
  { id: "wendys", name: "Wendy's", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "wendys.com" },
  { id: "chipotle", name: "Chipotle", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "chipotle.com" },
  { id: "swiss_chalet", name: "Swiss Chalet", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "swisschalet.com" },
  { id: "boston_pizza", name: "Boston Pizza", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "bostonpizza.com" },
  { id: "popeyes", name: "Popeyes", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "popeyes.com" },
  { id: "pizza_pizza", name: "Pizza Pizza", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "pizzapizza.ca" },
  { id: "dunkin", name: "Dunkin'", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "dunkindonuts.com" },
  { id: "panera", name: "Panera Bread", shortName: "Panera", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "panerabread.com", searchAliases: ["panera"] },
  { id: "kfc", name: "KFC", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "kfc.ca", logoDomainFallbacks: ["kfc.com"] },
  { id: "burger_king", name: "Burger King", shortName: "BK", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "burgerking.ca", logoDomainFallbacks: ["burgerking.com"], searchAliases: ["bk"] },
  { id: "taco_bell", name: "Taco Bell", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "tacobell.ca", logoDomainFallbacks: ["tacobell.com"] },
  { id: "dominos", name: "Domino's", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "dominos.ca", logoDomainFallbacks: ["dominos.com"] },
  { id: "pizza_hut", name: "Pizza Hut", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "pizzahut.ca", logoDomainFallbacks: ["pizzahut.com"] },
  { id: "aw", name: "A&W", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "aw.ca", searchAliases: ["a&w", "a and w"] },
  { id: "harveys", name: "Harvey's", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "harveys.ca" },
  { id: "five_guys", name: "Five Guys", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "fiveguys.com", logoDomainFallbacks: ["fiveguys.ca"] },
  { id: "the_keg", name: "The Keg", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "kegsteakhouse.com", searchAliases: ["keg"] },
  { id: "earls", name: "Earls Kitchen + Bar", shortName: "Earls", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "earls.ca" },
  { id: "cactus_club", name: "Cactus Club Cafe", shortName: "Cactus Club", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "cactusclubcafe.com" },
  { id: "second_cup", name: "Second Cup", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "secondcup.com" },
  { id: "freshii", name: "Freshii", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "freshii.com" },
  { id: "nandos", name: "Nando's", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "nandos.ca", logoDomainFallbacks: ["nandos.com"] },
  { id: "montanas", name: "Montana's BBQ & Bar", shortName: "Montana's", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "montanas.ca" },
  { id: "st_hubert", name: "St-Hubert", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "st-hubert.com", searchAliases: ["st hubert", "sthubert"] },
  { id: "jollibee", name: "Jollibee", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "jollibee.ca", logoDomainFallbacks: ["jollibee.com"] },
  { id: "auntie_annes", name: "Auntie Anne's", shortName: "Auntie Anne's", mcc: "5814", category: "dining", group: "Food & drink", logoDomain: "auntieannes.com" },
  { id: "olive_garden", name: "Olive Garden", mcc: "5812", category: "dining", group: "Food & drink", logoDomain: "olivegarden.com" },
  { id: "instacart", name: "Instacart", mcc: "5411", category: "groceries", group: "Food & drink", logoDomain: "instacart.com" },

  // Travel
  { id: "air_canada", name: "Air Canada", shortName: "Air Canada", mcc: "3000", category: "travel", group: "Travel", logoDomain: "aircanada.com" },
  { id: "westjet", name: "WestJet", mcc: "3000", category: "travel", group: "Travel", logoDomain: "westjet.com" },
  { id: "marriott", name: "Marriott", mcc: "7011", category: "travel", group: "Travel", logoDomain: "marriott.com" },
  { id: "expedia", name: "Expedia", mcc: "4722", category: "travel", group: "Travel", logoDomain: "expedia.ca", logoDomainFallbacks: ["expedia.com"] },
  { id: "airbnb", name: "Airbnb", mcc: "7011", category: "travel", group: "Travel", logoDomain: "airbnb.ca", logoDomainFallbacks: ["airbnb.com"] },
  { id: "booking", name: "Booking.com", shortName: "Booking", mcc: "4722", category: "travel", group: "Travel", logoDomain: "booking.com" },
  { id: "delta", name: "Delta Air Lines", shortName: "Delta", mcc: "3000", category: "travel", group: "Travel", logoDomain: "delta.com" },
  { id: "united", name: "United Airlines", shortName: "United", mcc: "3000", category: "travel", group: "Travel", logoDomain: "united.com" },
  { id: "hertz", name: "Hertz", mcc: "7512", category: "travel", group: "Travel", logoDomain: "hertz.com" },
  { id: "enterprise", name: "Enterprise", mcc: "7512", category: "travel", group: "Travel", logoDomain: "enterprise.ca", logoDomainFallbacks: ["enterprise.com"] },
  { id: "hilton", name: "Hilton", mcc: "7011", category: "travel", group: "Travel", logoDomain: "hilton.com" },
  { id: "fairmont", name: "Fairmont", mcc: "7011", category: "travel", group: "Travel", logoDomain: "fairmont.com" },
  { id: "porter", name: "Porter Airlines", shortName: "Porter", mcc: "3000", category: "travel", group: "Travel", logoDomain: "flyporter.com" },

  // Gas
  { id: "shell", name: "Shell", mcc: "5541", category: "gas", group: "Gas", logoDomain: "shell.com", logoDomainFallbacks: ["shell.ca"] },
  { id: "petro_canada", name: "Petro-Canada", shortName: "Petro-Can", mcc: "5541", category: "gas", group: "Gas", logoDomain: "petro-canada.ca" },
  { id: "esso", name: "Esso", mcc: "5541", category: "gas", group: "Gas", logoDomain: "esso.ca" },
  { id: "husky", name: "Husky", mcc: "5541", category: "gas", group: "Gas", logoDomain: "husky.ca" },
  { id: "circle_k", name: "Circle K", mcc: "5541", category: "gas", group: "Gas", logoDomain: "circlek.com" },
  { id: "canadian_tire_gas", name: "Canadian Tire Gas+", shortName: "CT Gas+", mcc: "5541", category: "gas", group: "Gas", logoDomain: "canadiantire.ca" },
  { id: "chevron", name: "Chevron", mcc: "5541", category: "gas", group: "Gas", logoDomain: "chevron.com" },
  { id: "bp", name: "BP", mcc: "5541", category: "gas", group: "Gas", logoDomain: "bp.com" },
  { id: "exxon", name: "Exxon", mcc: "5541", category: "gas", group: "Gas", logoDomain: "exxon.com" },

  // Shopping
  { id: "amazon", name: "Amazon.ca", shortName: "Amazon", mcc: "5399", category: "other", group: "Shopping", logoDomain: "amazon.ca" },
  { id: "amazon_us", name: "Amazon.com", shortName: "Amazon", mcc: "5399", category: "other", group: "Shopping", logoDomain: "amazon.com" },
  { id: "walmart", name: "Walmart", mcc: "5311", category: "other", group: "Shopping", logoDomain: "walmart.ca" },
  { id: "canadian_tire", name: "Canadian Tire", shortName: "CT", mcc: "5310", category: "other", group: "Shopping", logoDomain: "canadiantire.ca" },
  { id: "best_buy", name: "Best Buy", mcc: "5732", category: "other", group: "Shopping", logoDomain: "bestbuy.ca", logoDomainFallbacks: ["bestbuy.com"] },
  { id: "ikea", name: "IKEA", mcc: "5712", category: "other", group: "Shopping", logoDomain: "ikea.com" },
  { id: "home_depot", name: "Home Depot", mcc: "5200", category: "other", group: "Shopping", logoDomain: "homedepot.ca", logoDomainFallbacks: ["homedepot.com"] },
  { id: "lowes", name: "Lowe's", mcc: "5200", category: "other", group: "Shopping", logoDomain: "lowes.com", logoDomainFallbacks: ["lowes.ca"] },
  { id: "shoppers", name: "Shoppers Drug Mart", shortName: "Shoppers", mcc: "5912", category: "drugstore", group: "Shopping", logoDomain: "shoppersdrugmart.ca" },
  { id: "hudsons_bay", name: "Hudson's Bay", shortName: "The Bay", mcc: "5311", category: "other", group: "Shopping", logoDomain: "thebay.com" },
  { id: "winners", name: "Winners", mcc: "5311", category: "other", group: "Shopping", logoDomain: "winners.ca" },
  { id: "dollarama", name: "Dollarama", mcc: "5331", category: "other", group: "Shopping", logoDomain: "dollarama.com" },
  { id: "apple_store", name: "Apple Store", shortName: "Apple", mcc: "5732", category: "other", group: "Shopping", logoDomain: "apple.com" },
  { id: "nike", name: "Nike", mcc: "5651", category: "other", group: "Shopping", logoDomain: "nike.com" },
  { id: "target", name: "Target", mcc: "5311", category: "other", group: "Shopping", logoDomain: "target.com" },
  { id: "staples", name: "Staples", mcc: "5943", category: "other", group: "Shopping", logoDomain: "staples.ca", logoDomainFallbacks: ["staples.com"] },
  { id: "indigo", name: "Indigo", mcc: "5942", category: "other", group: "Shopping", logoDomain: "indigo.ca" },

  // Subscriptions
  { id: "spotify", name: "Spotify", mcc: "5815", category: "streaming", group: "Subscriptions", logoDomain: "spotify.com" },
  { id: "netflix", name: "Netflix", mcc: "5815", category: "streaming", group: "Subscriptions", logoDomain: "netflix.com" },
  { id: "rogers", name: "Rogers", shortName: "Rogers", mcc: "4814", category: "recurring_bills", group: "Subscriptions", logoDomain: "rogers.com" },
  { id: "disney_plus", name: "Disney+", mcc: "5815", category: "streaming", group: "Subscriptions", logoDomain: "disneyplus.com" },
  { id: "bell", name: "Bell", mcc: "4814", category: "recurring_bills", group: "Subscriptions", logoDomain: "bell.ca" },
  { id: "telus", name: "Telus", mcc: "4814", category: "recurring_bills", group: "Subscriptions", logoDomain: "telus.com" },
  { id: "crave", name: "Crave", mcc: "5815", category: "streaming", group: "Subscriptions", logoDomain: "crave.ca" },
  { id: "youtube_premium", name: "YouTube Premium", shortName: "YouTube", mcc: "5815", category: "streaming", group: "Subscriptions", logoDomain: "youtube.com" },
  { id: "adobe", name: "Adobe", mcc: "5815", category: "streaming", group: "Subscriptions", logoDomain: "adobe.com" },
  { id: "microsoft_365", name: "Microsoft 365", shortName: "Microsoft", mcc: "5815", category: "streaming", group: "Subscriptions", logoDomain: "microsoft.com" },
  { id: "amazon_prime", name: "Amazon Prime", shortName: "Prime", mcc: "5815", category: "streaming", group: "Subscriptions", logoDomain: "amazon.ca" },
  { id: "verizon", name: "Verizon", mcc: "4814", category: "recurring_bills", group: "Subscriptions", logoDomain: "verizon.com" },
  { id: "att", name: "AT&T", mcc: "4814", category: "recurring_bills", group: "Subscriptions", logoDomain: "att.com" },
  { id: "tmobile", name: "T-Mobile", shortName: "T-Mobile", mcc: "4814", category: "recurring_bills", group: "Subscriptions", logoDomain: "t-mobile.com" },

  // Entertainment
  { id: "cineplex", name: "Cineplex", mcc: "7832", category: "entertainment", group: "Entertainment", logoDomain: "cineplex.com" },
  { id: "steam", name: "Steam", mcc: "5816", category: "streaming", group: "Entertainment", logoDomain: "steampowered.com" },
  { id: "xbox", name: "Xbox", mcc: "5816", category: "streaming", group: "Entertainment", logoDomain: "xbox.com" },
  { id: "playstation", name: "PlayStation", shortName: "PSN", mcc: "5816", category: "streaming", group: "Entertainment", logoDomain: "playstation.com" },
  { id: "ticketmaster", name: "Ticketmaster", mcc: "7922", category: "entertainment", group: "Entertainment", logoDomain: "ticketmaster.ca", logoDomainFallbacks: ["ticketmaster.com"] },
  { id: "apple_tv", name: "Apple TV+", shortName: "Apple TV+", mcc: "5815", category: "streaming", group: "Entertainment", logoDomain: "apple.com" },
  { id: "ea", name: "EA", mcc: "5816", category: "streaming", group: "Entertainment", logoDomain: "ea.com" },
  { id: "amc", name: "AMC Theatres", shortName: "AMC", mcc: "7832", category: "entertainment", group: "Entertainment", logoDomain: "amctheatres.com" },

  // Health & pharmacy
  { id: "rexall", name: "Rexall", mcc: "5912", category: "drugstore", group: "Health & pharmacy", logoDomain: "rexall.ca" },
  { id: "london_drugs", name: "London Drugs", shortName: "London Drugs", mcc: "5912", category: "drugstore", group: "Health & pharmacy", logoDomain: "londondrugs.com" },
  { id: "goodlife", name: "GoodLife Fitness", shortName: "GoodLife", mcc: "7997", category: "fitness", group: "Health & pharmacy", logoDomain: "goodlifefitness.com" },
  { id: "cvs", name: "CVS", mcc: "5912", category: "drugstore", group: "Health & pharmacy", logoDomain: "cvs.com" },
  { id: "walgreens", name: "Walgreens", mcc: "5912", category: "drugstore", group: "Health & pharmacy", logoDomain: "walgreens.com" },
  { id: "peloton", name: "Peloton", mcc: "7997", category: "fitness", group: "Health & pharmacy", logoDomain: "onepeloton.com" },

  // Transportation
  { id: "uber", name: "Uber", mcc: "4121", category: "transportation", group: "Transportation", logoDomain: "uber.com" },
  { id: "lyft", name: "Lyft", mcc: "4121", category: "transportation", group: "Transportation", logoDomain: "lyft.com" },
  { id: "ttc", name: "TTC", mcc: "4111", category: "transportation", group: "Transportation", logoDomain: "ttc.ca" },
  { id: "presto", name: "Presto", mcc: "4111", category: "transportation", group: "Transportation", logoDomain: "prestocard.ca" },
  { id: "go_transit", name: "GO Transit", shortName: "GO", mcc: "4111", category: "transportation", group: "Transportation", logoDomain: "gotransit.com" },
  { id: "via_rail", name: "VIA Rail", shortName: "VIA", mcc: "4112", category: "travel", group: "Transportation", logoDomain: "viarail.ca" },
  { id: "mta", name: "MTA", mcc: "4111", category: "transportation", group: "Transportation", logoDomain: "mta.info" },
  { id: "clipper", name: "Clipper", mcc: "4111", category: "transportation", group: "Transportation", logoDomain: "clippercard.com" },

  // Education
  { id: "coursera", name: "Coursera", mcc: "8241", category: "education", group: "Education", logoDomain: "coursera.org" },
  { id: "udemy", name: "Udemy", mcc: "8241", category: "education", group: "Education", logoDomain: "udemy.com" },
  { id: "uoft", name: "University of Toronto", shortName: "U of T", mcc: "8220", category: "education", group: "Education", logoDomain: "utoronto.ca" },
  { id: "mcgill", name: "McGill University", shortName: "McGill", mcc: "8220", category: "education", group: "Education", logoDomain: "mcgill.ca" },
  { id: "ubc", name: "UBC", mcc: "8220", category: "education", group: "Education", logoDomain: "ubc.ca" },
  { id: "khan_academy", name: "Khan Academy", shortName: "Khan", mcc: "8241", category: "education", group: "Education", logoDomain: "khanacademy.org" },
  { id: "linkedin_learning", name: "LinkedIn Learning", shortName: "LinkedIn", mcc: "8241", category: "education", group: "Education", logoDomain: "linkedin.com" },
  { id: "ucla", name: "UCLA", mcc: "8220", category: "education", group: "Education", logoDomain: "ucla.edu" },
  { id: "nyu", name: "NYU", mcc: "8220", category: "education", group: "Education", logoDomain: "nyu.edu" },

  // Home & utilities
  { id: "enbridge", name: "Enbridge Gas", shortName: "Enbridge", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "enbridgegas.com" },
  { id: "hydro_one", name: "Hydro One", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "hydroone.com" },
  { id: "toronto_hydro", name: "Toronto Hydro", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "torontohydro.com" },
  { id: "bc_hydro", name: "BC Hydro", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "bchydro.com" },
  { id: "fortisbc", name: "FortisBC", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "fortisbc.com" },
  { id: "pge", name: "PG&E", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "pge.com" },
  { id: "sce", name: "Southern California Edison", shortName: "SCE", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "sce.com" },
  { id: "sdge", name: "San Diego Gas & Electric", shortName: "SDG&E", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "sdge.com" },
  { id: "coned", name: "Con Edison", shortName: "ConEd", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "coned.com" },
  { id: "duke_energy", name: "Duke Energy", shortName: "Duke", mcc: "4900", category: "recurring_bills", group: "Home & utilities", logoDomain: "duke-energy.com" },

  // Other
  { id: "paypal", name: "PayPal", mcc: "5999", category: "other", group: "Other", logoDomain: "paypal.com" },
  { id: "venmo", name: "Venmo", mcc: "5999", category: "other", group: "Other", logoDomain: "venmo.com" },
  { id: "costco_wholesale", name: "Costco Wholesale", shortName: "Costco", mcc: "5300", category: "other", group: "Other", logoDomain: "costco.ca" },
  { id: "charity", name: "Charitable donation", shortName: "Charity", mcc: "8398", category: "other", group: "Other" },
  { id: "atm", name: "ATM withdrawal", shortName: "ATM", mcc: "6011", category: "other", group: "Other" },
];
