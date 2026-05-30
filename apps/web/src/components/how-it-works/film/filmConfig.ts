/**
 * Film configuration — the single source of truth for the guided demo's
 * timeline, scene windows, captions, and authoring coordinate space.
 *
 * Everything is authored inside a fixed STAGE_W × STAGE_H coordinate box and
 * scaled to fit the container, so layout is identical (and clip-free) at every
 * breakpoint and in fullscreen.
 */

export const STAGE_W = 1000;
export const STAGE_H = 625; // 16:10

export const FILM_EASE = [0.22, 1, 0.36, 1] as const;
export const FILM_EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

export const CROSSFADE_MS = 520;

export type ChapterId = "online" | "tap" | "routing" | "wallet" | "closing";

export interface Chapter {
  id: ChapterId;
  title: string;
  start: number; // ms
  end: number; // ms
}

/** Scene windows. Sequential; neighbours crossfade at the boundaries. */
export const CHAPTERS: Chapter[] = [
  { id: "online", title: "Online checkout", start: 0, end: 11000 },
  { id: "tap", title: "Tap to pay", start: 11000, end: 20000 },
  { id: "routing", title: "Smart routing", start: 20000, end: 31000 },
  { id: "wallet", title: "Wallet & bills", start: 31000, end: 39000 },
  { id: "closing", title: "One tap", start: 39000, end: 43000 },
];

export const DURATION_MS = CHAPTERS[CHAPTERS.length - 1]!.end;

export interface Caption {
  start: number;
  end: number;
  text: string;
}

/** Lower-third captions — one line per beat. */
export const CAPTIONS: Caption[] = [
  { start: 600, end: 5400, text: "Shopping online? OneCard watches the checkout." },
  { start: 5400, end: 11000, text: "It fills in the card that earns the most — Amex Cobalt, 5× groceries." },
  { start: 11000, end: 20000, text: "In person, tap your phone or card — the same contactless tap you use today." },
  { start: 20000, end: 31000, text: "OneCard reads the merchant category and routes to the best card — in milliseconds." },
  { start: 31000, end: 39000, text: "Manage your wallet; recurring bills route to the optimal card automatically." },
  { start: 39000, end: 43000, text: "One tap. Smarter every time." },
];

export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Find the chapter active at a given time (clamped to the last chapter). */
export function chapterAt(ms: number): Chapter {
  for (const c of CHAPTERS) {
    if (ms >= c.start && ms < c.end) return c;
  }
  return CHAPTERS[CHAPTERS.length - 1]!;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
