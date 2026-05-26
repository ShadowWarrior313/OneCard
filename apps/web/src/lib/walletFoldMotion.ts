export const WALLET_PEEK = 44;
export const WALLET_SLIDE_UP = 128;
export const WALLET_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
};

/** Space above the fold so top-stack cards can slide up without clipping. */
export function walletSlideHeadroom(activeIndex: number): number {
  if (activeIndex < 0) return 0;
  return Math.max(0, WALLET_SLIDE_UP - activeIndex * WALLET_PEEK + 12);
}
