export const WALLET_PEEK = 44;
export const WALLET_SLIDE_UP = 128;
export const WALLET_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
};

/** Space above the fold so cards can slide up without clipping. */
export function walletSlideHeadroom(activeIndex: number): number {
  if (activeIndex < 0) return 0;
  // Always reserve full slide distance — partial headroom clips top-stack cards.
  return WALLET_SLIDE_UP + 16;
}
