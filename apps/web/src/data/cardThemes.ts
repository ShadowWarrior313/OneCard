/**
 * @deprecated Use getCardAppearance from cardAppearances.ts
 * Kept for backwards compatibility.
 */
import { getCardAppearance } from "./cardAppearances";

export type CardTheme = { accent: string };

export function getCardTheme(cardId: string, issuer?: string): CardTheme {
  const a = getCardAppearance(cardId, issuer);
  return { accent: a.accent };
}
