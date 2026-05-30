/** Shared motion tokens for /how-it-works — one vocabulary across player, bento, modals. */
export const DEMO_EASE = [0.22, 1, 0.36, 1] as const;
export const DEMO_EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

export const DEMO_MS = {
  crossfade: 500,
  entrance: 320,
  stagger: 55,
  guidedMove: 680,
  guidedClick: 220,
  zoom: 720,
  screen: 400,
} as const;

export const DEMO_PANEL_CLASS =
  "overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200/90 shadow-[0_1px_2px_rgba(11,11,15,0.05),0_12px_32px_-12px_rgba(11,11,15,0.12)]";
