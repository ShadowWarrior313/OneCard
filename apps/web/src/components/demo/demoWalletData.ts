import type { CardProduct } from "@onecard/shared-types";
import { CARD_CATALOG } from "@/data/cards";

/** 6th card in the routing carousel (index 5) */
export const DEMO_ROUTING_WINNER_INDEX = 5;

export const DEMO_ROUTING_CARDS = [
  { name: "Scotiabank Scene+", rate: "2.0× groceries", reward: "$2.36", winner: false },
  { name: "TD Cash Back", rate: "1.0× groceries", reward: "$1.18", winner: false },
  { name: "BMO CashBack", rate: "1.0× groceries", reward: "$1.18", winner: false },
  { name: "Neo Credit", rate: "1.0× groceries", reward: "$1.18", winner: false },
  { name: "RBC Ion Visa", rate: "1.0× groceries", reward: "$1.19", winner: false },
  { name: "Amex Cobalt", rate: "5.0× groceries", reward: "$8.47", winner: true },
  { name: "CIBC Dividend", rate: "1.0× groceries", reward: "$0.84", winner: false },
  { name: "Tangerine Money", rate: "2.0× groceries", reward: "$2.36", winner: false },
  { name: "PC Financial", rate: "3.0× groceries", reward: "$3.55", winner: false },
  { name: "Wealthsimple Cash", rate: "1.0× groceries", reward: "$1.18", winner: false },
] as const;

export const DEMO_WALLET_CARD_IDS = [
  "rbc_ion",
  "amex_cobalt",
  "cibc_dividend",
  "scotia_momentum",
] as const;

export const DEMO_SPEND_SELECT_INDEX = 1;

export function getDemoWalletCards(): CardProduct[] {
  return DEMO_WALLET_CARD_IDS.map(
    (id) => CARD_CATALOG.find((c) => c.cardId === id)!,
  ).filter(Boolean);
}

export const DEMO_SPEND_BY_CARD: Record<
  (typeof DEMO_WALLET_CARD_IDS)[number],
  { total: number; categories: { label: string; amount: number; pct: number }[] }
> = {
  amex_cobalt: {
    total: 342,
    categories: [
      { label: "Groceries", amount: 148, pct: 43 },
      { label: "Dining", amount: 112, pct: 33 },
      { label: "Transit", amount: 82, pct: 24 },
    ],
  },
  rbc_ion: {
    total: 198,
    categories: [
      { label: "Online", amount: 94, pct: 48 },
      { label: "Groceries", amount: 62, pct: 31 },
      { label: "Other", amount: 42, pct: 21 },
    ],
  },
  cibc_dividend: {
    total: 124,
    categories: [
      { label: "Gas", amount: 58, pct: 47 },
      { label: "Groceries", amount: 44, pct: 35 },
      { label: "Other", amount: 22, pct: 18 },
    ],
  },
  scotia_momentum: {
    total: 96,
    categories: [
      { label: "Gas", amount: 44, pct: 46 },
      { label: "Groceries", amount: 32, pct: 33 },
      { label: "Other", amount: 20, pct: 21 },
    ],
  },
};

export const DEMO_SPEND_RECENT = [
  {
    merchant: "Loblaws",
    date: "Today",
    amount: 118.4,
    category: "Groceries",
    reward: "+5,918 pts",
  },
  {
    merchant: "Farm Boy",
    date: "May 24",
    amount: 42.18,
    category: "Groceries",
    reward: "+2,109 pts",
  },
  {
    merchant: "Uber Eats",
    date: "May 22",
    amount: 38.5,
    category: "Dining",
    reward: "+1,925 pts",
  },
  {
    merchant: "TTC Presto",
    date: "May 20",
    amount: 156.0,
    category: "Transit",
    reward: "+780 pts",
  },
] as const;

/** Scroll targets (px) — diagnostic pause then payments */
export const SPEND_SCROLL_DIAGNOSTIC = 168;
export const SPEND_SCROLL_FULL = 288;

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/** Progress 0–1 within spend phase → vertical scroll offset */
export function spendScrollOffset(progress: number): number {
  if (progress < 0.45) return 0;
  if (progress < 0.62) {
    return smoothstep((progress - 0.45) / 0.17) * SPEND_SCROLL_DIAGNOSTIC;
  }
  if (progress < 0.92) {
    const t = smoothstep((progress - 0.62) / 0.3);
    return SPEND_SCROLL_DIAGNOSTIC + t * (SPEND_SCROLL_FULL - SPEND_SCROLL_DIAGNOSTIC);
  }
  return SPEND_SCROLL_FULL;
}

/** Monotonic scroll 0 → winner (single pass, progress 0–1 for whole routing scene) */
export function routingFocusIndex(progress: number): number {
  const winner = DEMO_ROUTING_WINNER_INDEX;
  if (progress >= 0.78) return winner;
  const eased = Math.pow(progress / 0.78, 1.35);
  return Math.min(winner, Math.floor(eased * (winner + 1)));
}

export function routingShowWinner(progress: number): boolean {
  return progress >= 0.78;
}

/** 0→1 smoothstep while Amex is centered — drives sky → emerald crossfade */
export function routingWinnerBlend(progress: number): number {
  if (progress < 0.68) return 0;
  if (progress >= 0.84) return 1;
  const t = (progress - 0.68) / (0.84 - 0.68);
  return t * t * (3 - 2 * t);
}

/** One-time pulse when Amex is first selected — not on route/complete re-entry */
export function routingWinnerPulse(progress: number): boolean {
  return progress >= 0.78 && progress < 0.86;
}

export function routingStatusMessage(progress: number): {
  kind: "comparing" | "routing" | "complete";
  text: string;
} {
  if (progress < 0.78) {
    return { kind: "comparing", text: "Comparing cards in your wallet…" };
  }
  if (progress < 0.92) {
    return { kind: "routing", text: "Routing to Amex Cobalt" };
  }
  return { kind: "complete", text: "Approved · 5× groceries" };
}
