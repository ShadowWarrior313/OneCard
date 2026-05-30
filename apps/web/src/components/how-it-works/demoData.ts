/** Re-export existing demo values — do not invent new merchants or amounts. */
export {
  DEMO_MERCHANT,
  DEMO_AMOUNT,
  DEMO_ROUTING_CARDS,
  DEMO_ROUTING_WINNER_INDEX,
  DEMO_SPEND_BY_CARD,
  DEMO_SPEND_RECENT,
  DEMO_WALLET_CARD_IDS,
  DEMO_SPEND_SELECT_INDEX,
  routingFocusIndex,
  routingWinnerBlend,
  routingStatusMessage,
  spendScrollOffset,
} from "@/components/how-it-works/demoDataCore";

export const DEMO_SPEND_CARD_LABEL = "Amex Cobalt";
export const DEMO_SPEND_TOTAL = 342;

export const DEMO_BILLS = [
  { card: "Amex Cobalt", due: "Jun 12", amount: "$412", routed: true },
  { card: "RBC Ion Visa", due: "Jun 18", amount: "$186", routed: false },
  { card: "CIBC Dividend", due: "Paid", amount: "$94", routed: false },
] as const;

export const TRUST_LINES = [
  "Tokenized routing — card numbers never touch our servers",
  "Rewards post to the accounts you already use",
  "Built for long-term use, not a weekend hack",
] as const;

export type FeatureId =
  | "routing"
  | "wallet"
  | "spend"
  | "bills"
  | "tokenized";

export type FeatureCardConfig = {
  id: FeatureId;
  headline: string;
  subcopy: string;
  gradient: string;
  lead?: boolean;
  bullets: string[];
};

export const FEATURE_CARDS: FeatureCardConfig[] = [
  {
    id: "routing",
    headline: "Smart routing on every tap",
    subcopy: "Routes each purchase to the card that earns most, scored in milliseconds.",
    gradient:
      "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(37,99,235,0.12), transparent 55%), linear-gradient(160deg, #eaf4fd 0%, #f8fbff 100%)",
    lead: true,
    bullets: [
      "Reads merchant category automatically",
      "Scores earn rates and bonus caps in milliseconds",
      "Charge settles on your real Visa, Amex, or Mastercard",
      "Rewards land on the account that earned them",
    ],
  },
  {
    id: "wallet",
    headline: "Your whole wallet, one card",
    subcopy: "Link your reward cards once.",
    gradient:
      "radial-gradient(ellipse 70% 50% at 80% 20%, rgba(139,92,246,0.1), transparent 50%), linear-gradient(160deg, #f5f3ff 0%, #faf9f7 100%)",
    bullets: [
      "Link Visa, Amex, and Mastercard accounts once",
      "One physical OneCard at checkout",
      "Your issuer apps stay unchanged",
      "Add or remove cards anytime",
    ],
  },
  {
    id: "spend",
    headline: "See where every reward came from",
    subcopy: "Rewards post to the accounts you already use; full visibility.",
    gradient:
      "radial-gradient(ellipse 70% 50% at 15% 80%, rgba(22,163,74,0.1), transparent 50%), linear-gradient(160deg, #ecfdf5 0%, #f8fafc 100%)",
    bullets: [
      "Monthly spend by category on each linked card",
      "Recent payments with earn category and points",
      "Same wallet view as the app demo",
      "Rewards still post on your existing accounts",
    ],
  },
  {
    id: "bills",
    headline: "Bills, routed automatically",
    subcopy: "Recurring bills earn too.",
    gradient:
      "radial-gradient(ellipse 70% 50% at 85% 75%, rgba(251,191,36,0.12), transparent 50%), linear-gradient(160deg, #fffbeb 0%, #faf9f7 100%)",
    bullets: [
      "Due dates and balances in one place",
      "Pay statements without opening each issuer app",
      "Routing picks the best card for each bill",
      "Scheduled payments stay on your real accounts",
    ],
  },
  {
    id: "tokenized",
    headline: "Tokenized by design",
    subcopy: "Card numbers never touch our servers.",
    gradient:
      "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(15,23,42,0.06), transparent 55%), linear-gradient(160deg, #f4f3f0 0%, #faf9f7 100%)",
    bullets: [
      "Tokenized routing — card numbers never touch our servers",
      "Linked cards represented by secure payment tokens",
      "Charges route without storing full card data",
      "Built for long-term use, not a weekend hack",
    ],
  },
];
