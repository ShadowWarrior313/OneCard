/**
 * Global guided-cursor path, in absolute stage coordinates, across the whole film.
 * Coordinates are kept in sync with the scene anchor comments:
 *   • Scene 1 "Use this card" button ≈ (800, 228)
 *   • Scene 3 winning row (after rise) ≈ (505, 262)
 *   • Scene 4 "Add a card" row        ≈ (278, 384)
 *
 * Fields are forward-filled: x/y are set on every key; hand/press/vis only when
 * they change (initial 0). The cursor is hidden (vis 0) during the physical
 * tap scene and the closing scene.
 */

export interface CursorKey {
  t: number;
  x: number;
  y: number;
  hand?: number; // 0 arrow, 1 pointer/hand
  press?: number; // click press 0..1
  vis?: number; // visibility 0..1
}

export const CURSOR_KEYS: CursorKey[] = [
  // ── Scene 1: online checkout ────────────────────────────────
  { t: 800, x: 520, y: 360, vis: 0 },
  { t: 1100, x: 520, y: 360, vis: 1 },
  { t: 1800, x: 470, y: 300 },
  { t: 3200, x: 430, y: 430 },
  { t: 4400, x: 560, y: 250 },
  { t: 5600, x: 742, y: 244 },
  { t: 6300, x: 800, y: 228, hand: 1 },
  { t: 6600, x: 800, y: 228, hand: 1, press: 1 },
  { t: 6820, x: 800, y: 228, hand: 1, press: 0 },
  { t: 7200, x: 700, y: 320, hand: 0 },
  { t: 8200, x: 650, y: 360 },
  { t: 9600, x: 650, y: 360, vis: 1 },
  { t: 10200, x: 650, y: 360, vis: 0 },

  // ── Scene 2: tap to pay (cursor hidden) ─────────────────────
  { t: 11000, x: 650, y: 360, vis: 0 },

  // ── Scene 3: routing ────────────────────────────────────────
  { t: 21000, x: 500, y: 470, vis: 0 },
  { t: 21400, x: 500, y: 470, vis: 1 },
  { t: 23500, x: 520, y: 430 },
  { t: 24600, x: 505, y: 300 },
  { t: 25000, x: 505, y: 262, hand: 1 },
  { t: 25200, x: 505, y: 262, hand: 1, press: 1 },
  { t: 25450, x: 505, y: 262, hand: 1, press: 0 },
  { t: 26200, x: 560, y: 230, hand: 0 },
  { t: 28600, x: 560, y: 230, vis: 1 },
  { t: 29200, x: 560, y: 230, vis: 0 },

  // ── Scene 4: wallet + bills ─────────────────────────────────
  { t: 31800, x: 280, y: 320, vis: 0 },
  { t: 32100, x: 280, y: 320, vis: 1 },
  { t: 33000, x: 278, y: 384, hand: 1 },
  { t: 33550, x: 278, y: 384, hand: 1, press: 1 },
  { t: 33820, x: 278, y: 384, hand: 1, press: 0 },
  { t: 34400, x: 360, y: 320, hand: 0 },
  { t: 35600, x: 620, y: 360 },
  { t: 37200, x: 620, y: 360, vis: 1 },
  { t: 37900, x: 620, y: 360, vis: 0 },
];

/** Times the guided cursor clicks — used for ripple haptics. */
export const CLICK_TIMES = [6600, 25200, 33600];

type Field = "x" | "y" | "hand" | "press" | "vis";

/** Forward-filled [inputRange, outputRange] for a single cursor field. */
export function cursorField(field: Field): [number[], number[]] {
  const init = field === "x" || field === "y" ? CURSOR_KEYS[0]![field] : 0;
  let last = init;
  const input: number[] = [];
  const output: number[] = [];
  for (const k of CURSOR_KEYS) {
    const val = k[field];
    if (val != null) last = val;
    input.push(k.t);
    output.push(last);
  }
  return [input, output];
}

/** Linear sample of a cursor field at an absolute time (for static ripple anchors). */
export function sampleCursor(field: "x" | "y", t: number): number {
  const [input, output] = cursorField(field);
  if (t <= input[0]!) return output[0]!;
  if (t >= input[input.length - 1]!) return output[output.length - 1]!;
  for (let i = 0; i < input.length - 1; i++) {
    if (t >= input[i]! && t <= input[i + 1]!) {
      const span = input[i + 1]! - input[i]! || 1;
      const f = (t - input[i]!) / span;
      return output[i]! + (output[i + 1]! - output[i]!) * f;
    }
  }
  return output[output.length - 1]!;
}
