import { routeTransaction } from "@onecard/rewards-engine";
import type {
  CardAlternative,
  CardProduct,
  RewardCategory,
  RewardRule,
  RoutingDecision,
  TransactionInput,
} from "@onecard/shared-types";
import cardRewardSnapshot from "../../../apps/web/src/data/cardRewards.snapshot.json" with { type: "json" };

export type DomainCategory = {
  category: RewardCategory;
  mcc: string;
  merchantId?: string;
  merchantName: string;
};

export type RecommendationInput = {
  hostname: string;
  cards: CardProduct[];
  amount?: number | null;
};

export type CardRecommendation = {
  decision: RoutingDecision;
  winner: CardAlternative;
  runnerUp?: CardAlternative;
  merchant: DomainCategory;
  amount?: number;
};

type SnapshotCard = {
  id: string;
  issuer: string;
  name: string;
  annualFee: number;
  network?: CardProduct["network"];
  pointValueCAD: number;
  currency: string;
  rewards: RewardRule[];
};

// Raw card data (PAN, CVV, expiry) is never stored here.
// Card entry goes through Stripe Elements → Stripe servers directly.
// OneCard stores only the resulting PaymentMethod token + safe display metadata.

const DOMAIN_RULES: Array<{
  match: string;
  category: RewardCategory;
  mcc: string;
  merchantId?: string;
  merchantName: string;
}> = [
  // ── Groceries ────────────────────────────────────────────────────────────
  { match: "loblaws", category: "groceries", mcc: "5411", merchantId: "loblaws", merchantName: "Loblaws" },
  { match: "nofrills", category: "groceries", mcc: "5411", merchantId: "no_frills", merchantName: "No Frills" },
  { match: "realcanadiansuperstore", category: "groceries", mcc: "5411", merchantId: "superstore", merchantName: "Real Canadian Superstore" },
  { match: "walmart", category: "groceries", mcc: "5411", merchantId: "walmart_grocery", merchantName: "Walmart" },
  { match: "instacart", category: "groceries", mcc: "5411", merchantId: "instacart", merchantName: "Instacart" },
  { match: "metro.ca", category: "groceries", mcc: "5411", merchantId: "metro", merchantName: "Metro" },
  { match: "sobeys", category: "groceries", mcc: "5411", merchantId: "sobeys", merchantName: "Sobeys" },
  { match: "freshco", category: "groceries", mcc: "5411", merchantId: "freshco", merchantName: "FreshCo" },
  { match: "farm-boy", category: "groceries", mcc: "5411", merchantId: "farm_boy", merchantName: "Farm Boy" },
  { match: "wholefoodsmarket", category: "groceries", mcc: "5411", merchantId: "whole_foods", merchantName: "Whole Foods Market" },
  { match: "saveonfoods", category: "groceries", mcc: "5411", merchantId: "save_on_foods", merchantName: "Save-On-Foods" },
  { match: "iga.net", category: "groceries", mcc: "5411", merchantId: "iga", merchantName: "IGA" },
  { match: "longos", category: "groceries", mcc: "5411", merchantId: "longos", merchantName: "Longo's" },
  { match: "foodland", category: "groceries", mcc: "5411", merchantId: "foodland", merchantName: "Foodland" },
  { match: "fortinos", category: "groceries", mcc: "5411", merchantId: "fortinos", merchantName: "Fortinos" },
  { match: "thriftyfoods", category: "groceries", mcc: "5411", merchantId: "thrifty_foods", merchantName: "Thrifty Foods" },
  { match: "coopatlantic", category: "groceries", mcc: "5411", merchantId: "coop_atlantic", merchantName: "Co-op Atlantic" },

  // ── Dining ───────────────────────────────────────────────────────────────
  { match: "ubereats", category: "dining", mcc: "5812", merchantId: "uber_eats", merchantName: "Uber Eats" },
  { match: "doordash", category: "dining", mcc: "5812", merchantId: "doordash", merchantName: "DoorDash" },
  { match: "skipthedishes", category: "dining", mcc: "5812", merchantId: "skip", merchantName: "SkipTheDishes" },
  { match: "grubhub", category: "dining", mcc: "5812", merchantId: "grubhub", merchantName: "Grubhub" },
  { match: "ritual.co", category: "dining", mcc: "5812", merchantId: "ritual", merchantName: "Ritual" },
  { match: "starbucks", category: "dining", mcc: "5814", merchantId: "starbucks", merchantName: "Starbucks" },
  { match: "mcdonalds", category: "dining", mcc: "5814", merchantId: "mcdonalds", merchantName: "McDonald's" },
  { match: "timhortons", category: "dining", mcc: "5814", merchantId: "tim_hortons", merchantName: "Tim Hortons" },
  { match: "harveys", category: "dining", mcc: "5814", merchantId: "harveys", merchantName: "Harvey's" },
  { match: "a-w.ca", category: "dining", mcc: "5814", merchantId: "a_and_w", merchantName: "A&W" },
  { match: "burgerking", category: "dining", mcc: "5814", merchantId: "burger_king", merchantName: "Burger King" },
  { match: "wendys", category: "dining", mcc: "5814", merchantId: "wendys", merchantName: "Wendy's" },
  { match: "kfc", category: "dining", mcc: "5814", merchantId: "kfc", merchantName: "KFC" },
  { match: "popeyes", category: "dining", mcc: "5814", merchantId: "popeyes", merchantName: "Popeyes" },
  { match: "chickfila", category: "dining", mcc: "5814", merchantId: "chick_fil_a", merchantName: "Chick-fil-A" },
  { match: "dairyqueen", category: "dining", mcc: "5814", merchantId: "dairy_queen", merchantName: "Dairy Queen" },
  { match: "pizzapizza", category: "dining", mcc: "5812", merchantId: "pizza_pizza", merchantName: "Pizza Pizza" },
  { match: "pizzahut", category: "dining", mcc: "5812", merchantId: "pizza_hut", merchantName: "Pizza Hut" },
  { match: "dominos", category: "dining", mcc: "5812", merchantId: "dominos", merchantName: "Domino's" },
  { match: "swisschalet", category: "dining", mcc: "5812", merchantId: "swiss_chalet", merchantName: "Swiss Chalet" },
  { match: "st-hubert", category: "dining", mcc: "5812", merchantId: "st_hubert", merchantName: "St-Hubert" },
  { match: "nandos", category: "dining", mcc: "5812", merchantId: "nandos", merchantName: "Nando's" },
  { match: "bostonpizza", category: "dining", mcc: "5812", merchantId: "boston_pizza", merchantName: "Boston Pizza" },
  { match: "jackastors", category: "dining", mcc: "5812", merchantId: "jack_astors", merchantName: "Jack Astor's" },
  { match: "eastsidemarios", category: "dining", mcc: "5812", merchantId: "east_side_marios", merchantName: "East Side Mario's" },
  { match: "moxies", category: "dining", mcc: "5812", merchantId: "moxies", merchantName: "Moxie's" },
  { match: "earls", category: "dining", mcc: "5812", merchantId: "earls", merchantName: "Earls" },
  { match: "freshii", category: "dining", mcc: "5812", merchantId: "freshii", merchantName: "Freshii" },
  { match: "chipotle", category: "dining", mcc: "5812", merchantId: "chipotle", merchantName: "Chipotle" },
  { match: "subway", category: "dining", mcc: "5814", merchantId: "subway", merchantName: "Subway" },
  { match: "secondcup", category: "dining", mcc: "5814", merchantId: "second_cup", merchantName: "Second Cup" },
  { match: "chatime", category: "dining", mcc: "5812", merchantId: "chatime", merchantName: "Chatime" },
  { match: "dennys", category: "dining", mcc: "5812", merchantId: "dennys", merchantName: "Denny's" },
  { match: "ihop", category: "dining", mcc: "5812", merchantId: "ihop", merchantName: "IHOP" },
  { match: "olivegarden", category: "dining", mcc: "5812", merchantId: "olive_garden", merchantName: "Olive Garden" },
  { match: "applebees", category: "dining", mcc: "5812", merchantId: "applebees", merchantName: "Applebee's" },
  { match: "chilis", category: "dining", mcc: "5812", merchantId: "chilis", merchantName: "Chili's" },
  { match: "outback", category: "dining", mcc: "5812", merchantId: "outback", merchantName: "Outback Steakhouse" },
  // Fine dining — still rewards as dining so card dining bonuses apply
  { match: "thekeg", category: "fine_dining", mcc: "5812", merchantId: "the_keg", merchantName: "The Keg" },
  { match: "cactusclub", category: "fine_dining", mcc: "5812", merchantId: "cactus_club", merchantName: "Cactus Club" },
  { match: "joeyrestaurants", category: "fine_dining", mcc: "5812", merchantId: "joey", merchantName: "Joey Restaurants" },
  { match: "ruthschris", category: "fine_dining", mcc: "5812", merchantId: "ruths_chris", merchantName: "Ruth's Chris Steak House" },
  { match: "mortons", category: "fine_dining", mcc: "5812", merchantId: "mortons", merchantName: "Morton's Steakhouse" },
  { match: "opentable", category: "fine_dining", mcc: "5812", merchantId: "opentable", merchantName: "OpenTable" },
  { match: "nobu", category: "fine_dining", mcc: "5812", merchantId: "nobu", merchantName: "Nobu" },
  { match: "canoe-restaurant", category: "fine_dining", mcc: "5812", merchantId: "canoe", merchantName: "Canoe Restaurant" },

  // ── Gas ──────────────────────────────────────────────────────────────────
  { match: "shell", category: "gas", mcc: "5541", merchantId: "shell", merchantName: "Shell" },
  { match: "petro-canada", category: "gas", mcc: "5541", merchantId: "petro_canada", merchantName: "Petro-Canada" },
  { match: "esso", category: "gas", mcc: "5541", merchantId: "esso", merchantName: "Esso" },
  { match: "husky", category: "gas", mcc: "5541", merchantId: "husky", merchantName: "Husky" },
  { match: "pioneer-energy", category: "gas", mcc: "5541", merchantId: "pioneer", merchantName: "Pioneer" },
  { match: "ultramar", category: "gas", mcc: "5541", merchantId: "ultramar", merchantName: "Ultramar" },
  { match: "mohawk", category: "gas", mcc: "5541", merchantId: "mohawk", merchantName: "Mohawk" },
  { match: "sunoco", category: "gas", mcc: "5541", merchantId: "sunoco", merchantName: "Sunoco" },
  { match: "chevron", category: "gas", mcc: "5541", merchantId: "chevron", merchantName: "Chevron" },
  { match: "irvingoil", category: "gas", mcc: "5541", merchantId: "irving_oil", merchantName: "Irving Oil" },

  // ── Travel ───────────────────────────────────────────────────────────────
  { match: "aircanada", category: "travel", mcc: "3000", merchantId: "air_canada", merchantName: "Air Canada" },
  { match: "westjet", category: "travel", mcc: "3000", merchantId: "westjet", merchantName: "WestJet" },
  { match: "delta", category: "travel", mcc: "3000", merchantId: "delta", merchantName: "Delta Air Lines" },
  { match: "united", category: "travel", mcc: "3000", merchantId: "united", merchantName: "United Airlines" },
  { match: "airfrance", category: "travel", mcc: "3000", merchantId: "air_france", merchantName: "Air France" },
  { match: "klm", category: "travel", mcc: "3000", merchantId: "klm", merchantName: "KLM" },
  { match: "lufthansa", category: "travel", mcc: "3000", merchantId: "lufthansa", merchantName: "Lufthansa" },
  { match: "britishairways", category: "travel", mcc: "3000", merchantId: "british_airways", merchantName: "British Airways" },
  { match: "emirates", category: "travel", mcc: "3000", merchantId: "emirates", merchantName: "Emirates" },
  { match: "flyporter", category: "travel", mcc: "3000", merchantId: "porter", merchantName: "Porter Airlines" },
  { match: "americanairlines", category: "travel", mcc: "3000", merchantId: "american_airlines", merchantName: "American Airlines" },
  { match: "booking", category: "travel", mcc: "4722", merchantId: "booking", merchantName: "Booking.com" },
  { match: "expedia", category: "travel", mcc: "4722", merchantId: "expedia", merchantName: "Expedia" },
  { match: "airbnb", category: "travel", mcc: "7011", merchantId: "airbnb", merchantName: "Airbnb" },
  { match: "kayak", category: "travel", mcc: "4722", merchantId: "kayak", merchantName: "Kayak" },
  { match: "trivago", category: "travel", mcc: "4722", merchantId: "trivago", merchantName: "Trivago" },
  { match: "hotels.com", category: "travel", mcc: "7011", merchantId: "hotels_com", merchantName: "Hotels.com" },
  { match: "vrbo", category: "travel", mcc: "7011", merchantId: "vrbo", merchantName: "VRBO" },
  { match: "priceline", category: "travel", mcc: "4722", merchantId: "priceline", merchantName: "Priceline" },
  { match: "skyscanner", category: "travel", mcc: "4722", merchantId: "skyscanner", merchantName: "Skyscanner" },
  { match: "marriott", category: "travel", mcc: "7011", merchantId: "marriott", merchantName: "Marriott" },
  { match: "hilton", category: "travel", mcc: "7011", merchantId: "hilton", merchantName: "Hilton" },
  { match: "hyatt", category: "travel", mcc: "7011", merchantId: "hyatt", merchantName: "Hyatt" },
  { match: "ihg", category: "travel", mcc: "7011", merchantId: "ihg", merchantName: "IHG Hotels" },
  { match: "bestwestern", category: "travel", mcc: "7011", merchantId: "best_western", merchantName: "Best Western" },
  { match: "fairmont", category: "travel", mcc: "7011", merchantId: "fairmont", merchantName: "Fairmont" },
  { match: "fourseasons", category: "travel", mcc: "7011", merchantId: "four_seasons", merchantName: "Four Seasons" },
  { match: "wyndham", category: "travel", mcc: "7011", merchantId: "wyndham", merchantName: "Wyndham" },
  { match: "accor", category: "travel", mcc: "7011", merchantId: "accor", merchantName: "Accor Hotels" },
  { match: "enterprise", category: "travel", mcc: "7512", merchantId: "enterprise", merchantName: "Enterprise" },
  { match: "hertz", category: "travel", mcc: "7512", merchantId: "hertz", merchantName: "Hertz" },
  { match: "avis", category: "travel", mcc: "7512", merchantId: "avis", merchantName: "Avis" },
  { match: "budget.com", category: "travel", mcc: "7512", merchantId: "budget", merchantName: "Budget Car Rental" },
  { match: "nationalcar", category: "travel", mcc: "7512", merchantId: "national_car", merchantName: "National Car Rental" },
  { match: "viarail", category: "travel", mcc: "4112", merchantId: "via_rail", merchantName: "VIA Rail" },
  { match: "amtrak", category: "travel", mcc: "4112", merchantId: "amtrak", merchantName: "Amtrak" },

  // ── Streaming ────────────────────────────────────────────────────────────
  { match: "netflix", category: "streaming", mcc: "5815", merchantId: "netflix", merchantName: "Netflix" },
  { match: "spotify", category: "streaming", mcc: "5815", merchantId: "spotify", merchantName: "Spotify" },
  { match: "disneyplus", category: "streaming", mcc: "5815", merchantId: "disney_plus", merchantName: "Disney+" },
  { match: "cravetv", category: "streaming", mcc: "5815", merchantId: "crave", merchantName: "Crave" },
  { match: "primevideo", category: "streaming", mcc: "5815", merchantId: "prime_video", merchantName: "Prime Video" },
  { match: "tv.apple", category: "streaming", mcc: "5815", merchantId: "apple_tv", merchantName: "Apple TV+" },
  { match: "hbomax", category: "streaming", mcc: "5815", merchantId: "hbo_max", merchantName: "Max (HBO)" },
  { match: "max.com", category: "streaming", mcc: "5815", merchantId: "hbo_max", merchantName: "Max (HBO)" },
  { match: "hulu", category: "streaming", mcc: "5815", merchantId: "hulu", merchantName: "Hulu" },
  { match: "paramountplus", category: "streaming", mcc: "5815", merchantId: "paramount_plus", merchantName: "Paramount+" },
  { match: "peacocktv", category: "streaming", mcc: "5815", merchantId: "peacock", merchantName: "Peacock" },
  { match: "discoveryplus", category: "streaming", mcc: "5815", merchantId: "discovery_plus", merchantName: "Discovery+" },
  { match: "crunchyroll", category: "streaming", mcc: "5815", merchantId: "crunchyroll", merchantName: "Crunchyroll" },
  { match: "music.apple", category: "streaming", mcc: "5815", merchantId: "apple_music", merchantName: "Apple Music" },
  { match: "tidal", category: "streaming", mcc: "5815", merchantId: "tidal", merchantName: "Tidal" },
  { match: "deezer", category: "streaming", mcc: "5815", merchantId: "deezer", merchantName: "Deezer" },
  { match: "audible", category: "streaming", mcc: "5815", merchantId: "audible", merchantName: "Audible" },
  { match: "siriusxm", category: "streaming", mcc: "5815", merchantId: "sirius_xm", merchantName: "SiriusXM" },
  { match: "youtube.com/premium", category: "streaming", mcc: "5815", merchantId: "youtube_premium", merchantName: "YouTube Premium" },

  // ── Recurring Bills ──────────────────────────────────────────────────────
  { match: "rogers", category: "recurring_bills", mcc: "4814", merchantId: "rogers", merchantName: "Rogers" },
  { match: "bell", category: "recurring_bills", mcc: "4814", merchantId: "bell", merchantName: "Bell" },
  { match: "telus", category: "recurring_bills", mcc: "4814", merchantId: "telus", merchantName: "Telus" },
  { match: "shaw", category: "recurring_bills", mcc: "4814", merchantId: "shaw", merchantName: "Shaw" },
  { match: "videotron", category: "recurring_bills", mcc: "4814", merchantId: "videotron", merchantName: "Vidéotron" },
  { match: "fido", category: "recurring_bills", mcc: "4814", merchantId: "fido", merchantName: "Fido" },
  { match: "koodo", category: "recurring_bills", mcc: "4814", merchantId: "koodo", merchantName: "Koodo" },
  { match: "virginplus", category: "recurring_bills", mcc: "4814", merchantId: "virgin_plus", merchantName: "Virgin Plus" },
  { match: "publicmobile", category: "recurring_bills", mcc: "4814", merchantId: "public_mobile", merchantName: "Public Mobile" },
  { match: "freedommobile", category: "recurring_bills", mcc: "4814", merchantId: "freedom_mobile", merchantName: "Freedom Mobile" },
  { match: "eastlink", category: "recurring_bills", mcc: "4814", merchantId: "eastlink", merchantName: "Eastlink" },
  { match: "sasktel", category: "recurring_bills", mcc: "4814", merchantId: "sasktel", merchantName: "SaskTel" },
  { match: "hydro", category: "recurring_bills", mcc: "4900", merchantId: "sector_utilities", merchantName: "Utility bill" },
  { match: "enbridge", category: "recurring_bills", mcc: "4900", merchantId: "enbridge", merchantName: "Enbridge Gas" },
  { match: "fortisbc", category: "recurring_bills", mcc: "4900", merchantId: "fortis_bc", merchantName: "FortisBC" },
  { match: "saskpower", category: "recurring_bills", mcc: "4900", merchantId: "saskpower", merchantName: "SaskPower" },
  { match: "nspower", category: "recurring_bills", mcc: "4900", merchantId: "ns_power", merchantName: "Nova Scotia Power" },
  { match: "icloud", category: "recurring_bills", mcc: "4814", merchantId: "icloud", merchantName: "iCloud" },
  { match: "one.google", category: "recurring_bills", mcc: "4814", merchantId: "google_one", merchantName: "Google One" },
  { match: "dropbox", category: "recurring_bills", mcc: "4814", merchantId: "dropbox", merchantName: "Dropbox" },
  { match: "microsoft365", category: "recurring_bills", mcc: "4814", merchantId: "microsoft_365", merchantName: "Microsoft 365" },
  { match: "microsoftonline", category: "recurring_bills", mcc: "4814", merchantId: "microsoft_365", merchantName: "Microsoft 365" },

  // ── Entertainment ────────────────────────────────────────────────────────
  { match: "ticketmaster", category: "entertainment", mcc: "7922", merchantId: "ticketmaster", merchantName: "Ticketmaster" },
  { match: "cineplex", category: "entertainment", mcc: "7832", merchantId: "cineplex", merchantName: "Cineplex" },
  { match: "eventbrite", category: "entertainment", mcc: "7922", merchantId: "eventbrite", merchantName: "Eventbrite" },
  { match: "stubhub", category: "entertainment", mcc: "7922", merchantId: "stubhub", merchantName: "StubHub" },
  { match: "seatgeek", category: "entertainment", mcc: "7922", merchantId: "seatgeek", merchantName: "SeatGeek" },
  { match: "livenation", category: "entertainment", mcc: "7922", merchantId: "live_nation", merchantName: "Live Nation" },
  { match: "store.steampowered", category: "entertainment", mcc: "5816", merchantId: "steam", merchantName: "Steam" },
  { match: "epicgames", category: "entertainment", mcc: "5816", merchantId: "epic_games", merchantName: "Epic Games" },
  { match: "store.playstation", category: "entertainment", mcc: "5816", merchantId: "playstation", merchantName: "PlayStation Store" },
  { match: "xbox", category: "entertainment", mcc: "5816", merchantId: "xbox", merchantName: "Xbox" },
  { match: "nintendo", category: "entertainment", mcc: "5816", merchantId: "nintendo", merchantName: "Nintendo" },
  { match: "topgolf", category: "entertainment", mcc: "7996", merchantId: "top_golf", merchantName: "Topgolf" },
  { match: "bowlero", category: "entertainment", mcc: "7996", merchantId: "bowlero", merchantName: "Bowlero" },

  // ── Transportation ───────────────────────────────────────────────────────
  { match: "uber", category: "transportation", mcc: "4121", merchantId: "uber", merchantName: "Uber" },
  { match: "lyft", category: "transportation", mcc: "4121", merchantId: "lyft", merchantName: "Lyft" },
  { match: "parkwhiz", category: "transportation", mcc: "4121", merchantId: "parkwhiz", merchantName: "ParkWhiz" },
  { match: "spothero", category: "transportation", mcc: "4121", merchantId: "spothero", merchantName: "SpotHero" },
  { match: "greyhound", category: "transportation", mcc: "4131", merchantId: "greyhound", merchantName: "Greyhound" },
  { match: "megabus", category: "transportation", mcc: "4131", merchantId: "megabus", merchantName: "Megabus" },
  { match: "ola", category: "transportation", mcc: "4121", merchantId: "ola", merchantName: "Ola" },

  // ── Electronics ──────────────────────────────────────────────────────────
  { match: "apple.com", category: "electronics", mcc: "5732", merchantId: "apple", merchantName: "Apple" },
  { match: "bestbuy", category: "electronics", mcc: "5732", merchantId: "best_buy", merchantName: "Best Buy" },
  { match: "thesource", category: "electronics", mcc: "5732", merchantId: "the_source", merchantName: "The Source" },
  { match: "memoryexpress", category: "electronics", mcc: "5732", merchantId: "memory_express", merchantName: "Memory Express" },
  { match: "canadacomputers", category: "electronics", mcc: "5732", merchantId: "canada_computers", merchantName: "Canada Computers" },
  { match: "newegg", category: "electronics", mcc: "5732", merchantId: "newegg", merchantName: "Newegg" },
  { match: "bhphotovideo", category: "electronics", mcc: "5732", merchantId: "b_and_h", merchantName: "B&H Photo" },
  { match: "adorama", category: "electronics", mcc: "5732", merchantId: "adorama", merchantName: "Adorama" },
  { match: "samsung.com", category: "electronics", mcc: "5732", merchantId: "samsung", merchantName: "Samsung" },
  { match: "microsoft.com", category: "electronics", mcc: "5734", merchantId: "microsoft", merchantName: "Microsoft" },
  { match: "bose", category: "electronics", mcc: "5732", merchantId: "bose", merchantName: "Bose" },
  { match: "sonos", category: "electronics", mcc: "5732", merchantId: "sonos", merchantName: "Sonos" },
  { match: "dyson", category: "electronics", mcc: "5732", merchantId: "dyson", merchantName: "Dyson" },
  { match: "logitech", category: "electronics", mcc: "5732", merchantId: "logitech", merchantName: "Logitech" },
  { match: "dell", category: "electronics", mcc: "5732", merchantId: "dell", merchantName: "Dell" },
  { match: "lenovo", category: "electronics", mcc: "5732", merchantId: "lenovo", merchantName: "Lenovo" },
  { match: "hp.com", category: "electronics", mcc: "5732", merchantId: "hp", merchantName: "HP" },
  { match: "staples", category: "electronics", mcc: "5734", merchantId: "staples", merchantName: "Staples" },

  // ── Drugstore ────────────────────────────────────────────────────────────
  { match: "shoppersdrugmart", category: "drugstore", mcc: "5912", merchantId: "shoppers", merchantName: "Shoppers Drug Mart" },
  { match: "rexall", category: "drugstore", mcc: "5912", merchantId: "rexall", merchantName: "Rexall" },
  { match: "jeancoutu", category: "drugstore", mcc: "5912", merchantId: "jean_coutu", merchantName: "Jean Coutu" },
  { match: "familiprix", category: "drugstore", mcc: "5912", merchantId: "familiprix", merchantName: "Familiprix" },
  { match: "uniprix", category: "drugstore", mcc: "5912", merchantId: "uniprix", merchantName: "Uniprix" },
  { match: "brunet", category: "drugstore", mcc: "5912", merchantId: "brunet", merchantName: "Brunet" },
  { match: "londondrugs", category: "drugstore", mcc: "5912", merchantId: "london_drugs", merchantName: "London Drugs" },
  { match: "cvs", category: "drugstore", mcc: "5912", merchantId: "cvs", merchantName: "CVS" },
  { match: "walgreens", category: "drugstore", mcc: "5912", merchantId: "walgreens", merchantName: "Walgreens" },
  { match: "riteaid", category: "drugstore", mcc: "5912", merchantId: "rite_aid", merchantName: "Rite Aid" },

  // ── Adventure / Sporting Goods ───────────────────────────────────────────
  { match: "mec.ca", category: "adventure", mcc: "5941", merchantId: "mec", merchantName: "MEC" },
  { match: "sportchek", category: "adventure", mcc: "5941", merchantId: "sport_chek", merchantName: "Sport Chek" },
  { match: "atmosphere", category: "adventure", mcc: "5941", merchantId: "atmosphere", merchantName: "Atmosphere" },
  { match: "rei.com", category: "adventure", mcc: "5941", merchantId: "rei", merchantName: "REI" },
  { match: "basspro", category: "adventure", mcc: "5941", merchantId: "bass_pro", merchantName: "Bass Pro Shops" },
  { match: "cabelas", category: "adventure", mcc: "5941", merchantId: "cabelas", merchantName: "Cabela's" },
  { match: "sportinglife", category: "adventure", mcc: "5941", merchantId: "sporting_life", merchantName: "Sporting Life" },
  { match: "decathlon", category: "adventure", mcc: "5941", merchantId: "decathlon", merchantName: "Decathlon" },
  { match: "golftown", category: "adventure", mcc: "5941", merchantId: "golf_town", merchantName: "Golf Town" },
  { match: "mountainwarehouse", category: "adventure", mcc: "5941", merchantId: "mountain_warehouse", merchantName: "Mountain Warehouse" },
  { match: "patagonia", category: "adventure", mcc: "5941", merchantId: "patagonia", merchantName: "Patagonia" },
  { match: "thenorthface", category: "adventure", mcc: "5941", merchantId: "the_north_face", merchantName: "The North Face" },
  { match: "arcteryx", category: "adventure", mcc: "5941", merchantId: "arcteryx", merchantName: "Arc'teryx" },
  { match: "columbia", category: "adventure", mcc: "5941", merchantId: "columbia", merchantName: "Columbia Sportswear" },

  // ── Fitness ──────────────────────────────────────────────────────────────
  { match: "goodlifefitness", category: "fitness", mcc: "7997", merchantId: "goodlife", merchantName: "GoodLife Fitness" },
  { match: "lafitness", category: "fitness", mcc: "7997", merchantId: "la_fitness", merchantName: "LA Fitness" },
  { match: "goldsgym", category: "fitness", mcc: "7997", merchantId: "golds_gym", merchantName: "Gold's Gym" },
  { match: "planetfitness", category: "fitness", mcc: "7997", merchantId: "planet_fitness", merchantName: "Planet Fitness" },
  { match: "anytimefitness", category: "fitness", mcc: "7997", merchantId: "anytime_fitness", merchantName: "Anytime Fitness" },
  { match: "crunchfitness", category: "fitness", mcc: "7997", merchantId: "crunch", merchantName: "Crunch Fitness" },
  { match: "orangetheory", category: "fitness", mcc: "7997", merchantId: "orangetheory", merchantName: "Orangetheory" },
  { match: "soulcycle", category: "fitness", mcc: "7997", merchantId: "soul_cycle", merchantName: "SoulCycle" },
  { match: "peloton", category: "fitness", mcc: "7997", merchantId: "peloton", merchantName: "Peloton" },
  { match: "classpass", category: "fitness", mcc: "7997", merchantId: "classpass", merchantName: "ClassPass" },
  { match: "ymca", category: "fitness", mcc: "7997", merchantId: "ymca", merchantName: "YMCA" },
  { match: "lululemon", category: "fitness", mcc: "5941", merchantId: "lululemon", merchantName: "Lululemon" },

  // ── Education ────────────────────────────────────────────────────────────
  { match: "coursera", category: "education", mcc: "8299", merchantId: "coursera", merchantName: "Coursera" },
  { match: "udemy", category: "education", mcc: "8299", merchantId: "udemy", merchantName: "Udemy" },
  { match: "learning.linkedin", category: "education", mcc: "8299", merchantId: "linkedin_learning", merchantName: "LinkedIn Learning" },
  { match: "skillshare", category: "education", mcc: "8299", merchantId: "skillshare", merchantName: "Skillshare" },
  { match: "masterclass", category: "education", mcc: "8299", merchantId: "masterclass", merchantName: "MasterClass" },
  { match: "duolingo", category: "education", mcc: "8299", merchantId: "duolingo", merchantName: "Duolingo" },
  { match: "babbel", category: "education", mcc: "8299", merchantId: "babbel", merchantName: "Babbel" },
  { match: "rosettastone", category: "education", mcc: "8299", merchantId: "rosetta_stone", merchantName: "Rosetta Stone" },
  { match: "chegg", category: "education", mcc: "8299", merchantId: "chegg", merchantName: "Chegg" },
  { match: "khanacademy", category: "education", mcc: "8299", merchantId: "khan_academy", merchantName: "Khan Academy" },
  { match: "brilliant.org", category: "education", mcc: "8299", merchantId: "brilliant", merchantName: "Brilliant" },
  { match: "datacamp", category: "education", mcc: "8299", merchantId: "datacamp", merchantName: "DataCamp" },
  { match: "pluralsight", category: "education", mcc: "8299", merchantId: "pluralsight", merchantName: "Pluralsight" },
  { match: "edx", category: "education", mcc: "8299", merchantId: "edx", merchantName: "edX" },
  { match: "domestika", category: "education", mcc: "8299", merchantId: "domestika", merchantName: "Domestika" },
  { match: "abebooks", category: "education", mcc: "5942", merchantId: "abebooks", merchantName: "AbeBooks" },

  // ── Beauty ───────────────────────────────────────────────────────────────
  { match: "sephora", category: "beauty", mcc: "7298", merchantId: "sephora", merchantName: "Sephora" },
  { match: "ulta", category: "beauty", mcc: "7298", merchantId: "ulta", merchantName: "Ulta Beauty" },
  { match: "maccosmetics", category: "beauty", mcc: "7298", merchantId: "mac", merchantName: "MAC Cosmetics" },
  { match: "lush", category: "beauty", mcc: "7298", merchantId: "lush", merchantName: "Lush" },
  { match: "thebodyshop", category: "beauty", mcc: "7298", merchantId: "body_shop", merchantName: "The Body Shop" },
  { match: "loccitane", category: "beauty", mcc: "7298", merchantId: "loccitane", merchantName: "L'Occitane" },
  { match: "kiehls", category: "beauty", mcc: "7298", merchantId: "kiehls", merchantName: "Kiehl's" },
  { match: "glossier", category: "beauty", mcc: "7298", merchantId: "glossier", merchantName: "Glossier" },
  { match: "colourpop", category: "beauty", mcc: "7298", merchantId: "colourpop", merchantName: "ColourPop" },
  { match: "esteelauder", category: "beauty", mcc: "7298", merchantId: "estee_lauder", merchantName: "Estée Lauder" },

  // ── Home Improvement ─────────────────────────────────────────────────────
  { match: "homedepot", category: "home_improvement", mcc: "5211", merchantId: "home_depot", merchantName: "Home Depot" },
  { match: "lowes", category: "home_improvement", mcc: "5211", merchantId: "lowes", merchantName: "Lowe's" },
  { match: "rona", category: "home_improvement", mcc: "5211", merchantId: "rona", merchantName: "Rona" },
  { match: "homehardware", category: "home_improvement", mcc: "5251", merchantId: "home_hardware", merchantName: "Home Hardware" },
  { match: "ikea", category: "home_improvement", mcc: "5712", merchantId: "ikea", merchantName: "IKEA" },
  { match: "wayfair", category: "home_improvement", mcc: "5712", merchantId: "wayfair", merchantName: "Wayfair" },
  { match: "structube", category: "home_improvement", mcc: "5712", merchantId: "structube", merchantName: "Structube" },
  { match: "article.com", category: "home_improvement", mcc: "5712", merchantId: "article", merchantName: "Article" },
  { match: "restorationhardware", category: "home_improvement", mcc: "5712", merchantId: "rh", merchantName: "RH (Restoration Hardware)" },
  { match: "westelm", category: "home_improvement", mcc: "5712", merchantId: "west_elm", merchantName: "West Elm" },
  { match: "potterybarn", category: "home_improvement", mcc: "5712", merchantId: "pottery_barn", merchantName: "Pottery Barn" },
  { match: "crateandbarrel", category: "home_improvement", mcc: "5712", merchantId: "crate_barrel", merchantName: "Crate & Barrel" },

  // ── Clothing ─────────────────────────────────────────────────────────────
  { match: "hm.com", category: "clothing", mcc: "5651", merchantId: "h_and_m", merchantName: "H&M" },
  { match: "zara", category: "clothing", mcc: "5651", merchantId: "zara", merchantName: "Zara" },
  { match: "gap", category: "clothing", mcc: "5651", merchantId: "gap", merchantName: "Gap" },
  { match: "oldnavy", category: "clothing", mcc: "5651", merchantId: "old_navy", merchantName: "Old Navy" },
  { match: "bananarepublic", category: "clothing", mcc: "5651", merchantId: "banana_republic", merchantName: "Banana Republic" },
  { match: "jcrew", category: "clothing", mcc: "5651", merchantId: "j_crew", merchantName: "J.Crew" },
  { match: "nordstrom", category: "clothing", mcc: "5651", merchantId: "nordstrom", merchantName: "Nordstrom" },
  { match: "hudsonsbay", category: "clothing", mcc: "5311", merchantId: "hudsons_bay", merchantName: "Hudson's Bay" },
  { match: "simons.ca", category: "clothing", mcc: "5651", merchantId: "simons", merchantName: "Simons" },
  { match: "nike", category: "clothing", mcc: "5651", merchantId: "nike", merchantName: "Nike" },
  { match: "adidas", category: "clothing", mcc: "5651", merchantId: "adidas", merchantName: "Adidas" },
  { match: "underarmour", category: "clothing", mcc: "5651", merchantId: "under_armour", merchantName: "Under Armour" },
  { match: "asos", category: "clothing", mcc: "5651", merchantId: "asos", merchantName: "ASOS" },
  { match: "winners", category: "clothing", mcc: "5651", merchantId: "winners", merchantName: "Winners" },
  { match: "marshalls", category: "clothing", mcc: "5651", merchantId: "marshalls", merchantName: "Marshalls" },
  { match: "uniqlo", category: "clothing", mcc: "5651", merchantId: "uniqlo", merchantName: "Uniqlo" },
  { match: "ralphlauren", category: "clothing", mcc: "5651", merchantId: "ralph_lauren", merchantName: "Ralph Lauren" },
  { match: "tommyhilfiger", category: "clothing", mcc: "5651", merchantId: "tommy_hilfiger", merchantName: "Tommy Hilfiger" },
  { match: "coach", category: "clothing", mcc: "5699", merchantId: "coach", merchantName: "Coach" },
  { match: "katespade", category: "clothing", mcc: "5699", merchantId: "kate_spade", merchantName: "Kate Spade" },
  { match: "michaelkors", category: "clothing", mcc: "5699", merchantId: "michael_kors", merchantName: "Michael Kors" },

  // ── Pets ─────────────────────────────────────────────────────────────────
  { match: "petsmart", category: "pets", mcc: "5995", merchantId: "petsmart", merchantName: "PetSmart" },
  { match: "petco", category: "pets", mcc: "5995", merchantId: "petco", merchantName: "Petco" },
  { match: "chewy", category: "pets", mcc: "5995", merchantId: "chewy", merchantName: "Chewy" },
  { match: "petvalu", category: "pets", mcc: "5995", merchantId: "pet_valu", merchantName: "Pet Valu" },
  { match: "globalpetfoods", category: "pets", mcc: "5995", merchantId: "global_pet_foods", merchantName: "Global Pet Foods" },
  { match: "petland", category: "pets", mcc: "5995", merchantId: "petland", merchantName: "Petland" },

  // ── Retail (general) ─────────────────────────────────────────────────────
  { match: "amazon", category: "retail", mcc: "5399", merchantId: "amazon", merchantName: "Amazon" },
  { match: "costco", category: "retail", mcc: "5300", merchantId: "costco", merchantName: "Costco" },
  { match: "target", category: "retail", mcc: "5310", merchantId: "target", merchantName: "Target" },
  { match: "canadiantire", category: "retail", mcc: "5533", merchantId: "canadian_tire", merchantName: "Canadian Tire" },
  { match: "dollarama", category: "retail", mcc: "5310", merchantId: "dollarama", merchantName: "Dollarama" },
  { match: "shopify", category: "retail", mcc: "5399", merchantId: "shopify", merchantName: "Shopify Store" },
  { match: "etsy", category: "retail", mcc: "5999", merchantId: "etsy", merchantName: "Etsy" },
  { match: "shein", category: "retail", mcc: "5699", merchantId: "shein", merchantName: "Shein" },
];

const DEFAULT_MERCHANT: DomainCategory = {
  category: "other",
  mcc: "5999",
  merchantName: "this merchant",
};

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function categoryForDomain(hostname: string): DomainCategory {
  const host = normalizeHost(hostname);
  const rule = DOMAIN_RULES.find((entry) => host.includes(entry.match));
  return rule ?? DEFAULT_MERCHANT;
}

export const CARD_CATALOG: CardProduct[] = (cardRewardSnapshot as SnapshotCard[]).map((card) => ({
  cardId: card.id,
  issuer: card.issuer,
  displayName: card.name,
  annualFee: card.annualFee,
  currency: card.currency,
  pointValueCents: Math.round(card.pointValueCAD * 10000) / 100,
  network: card.network,
  rewards: card.rewards,
}));

export const DEFAULT_WALLET_CARD_IDS = [
  "amex_cobalt",
  "amex_gold",
  "cibc_dividend",
  "rbc_ion",
] as const;

export const SAMPLE_CARDS = getCardsByIds([...DEFAULT_WALLET_CARD_IDS]);

export function getCardById(cardId: string): CardProduct | undefined {
  return CARD_CATALOG.find((card) => card.cardId === cardId);
}

export function getCardsByIds(cardIds: string[]): CardProduct[] {
  const wanted = new Set(cardIds);
  return CARD_CATALOG.filter((card) => wanted.has(card.cardId));
}

export function recommendCard(input: RecommendationInput): CardRecommendation | null {
  if (input.cards.length === 0) return null;

  const merchant = categoryForDomain(input.hostname);
  const amount =
    typeof input.amount === "number" && Number.isFinite(input.amount) && input.amount > 0
      ? input.amount
      : 1;
  const transaction: TransactionInput = {
    amount,
    merchantName: merchant.merchantName,
    merchantId: merchant.merchantId,
    mcc: merchant.mcc,
    category: merchant.category,
  };
  const decision = routeTransaction({
    transaction,
    portfolio: {
      cards: input.cards,
      usage: [],
      preferences: { preferCashback: false },
      defaultCardId: input.cards[0]?.cardId,
    },
    mode: "virtual_provisioning",
  });

  return {
    decision,
    winner: decision.alternatives[0]!,
    runnerUp: decision.alternatives[1],
    merchant,
    amount: amount === input.amount ? amount : undefined,
  };
}
