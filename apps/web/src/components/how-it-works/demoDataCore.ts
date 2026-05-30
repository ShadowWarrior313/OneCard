/** Thin re-export layer so demoData.ts stays the public API for how-it-works. */
export {
  DEMO_ROUTING_CARDS,
  DEMO_ROUTING_WINNER_INDEX,
  DEMO_SPEND_BY_CARD,
  DEMO_SPEND_RECENT,
  DEMO_WALLET_CARD_IDS,
  DEMO_SPEND_SELECT_INDEX,
  routingFocusIndex,
  routingWinnerBlend,
  routingShowWinner,
  routingStatusMessage,
  spendScrollOffset,
} from "@/components/demo/demoWalletData";

export const DEMO_MERCHANT = "Loblaws";
export const DEMO_AMOUNT = "$118.40";
