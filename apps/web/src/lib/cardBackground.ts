import type { CSSProperties } from "react";
import type { CardAppearance } from "@/data/cardAppearances";

/** Solid fill — no fade to white on stack tabs */
export function cardBackgroundStyle(a: CardAppearance): CSSProperties {
  return {
    background: `linear-gradient(145deg, ${a.colorFrom} 0%, ${a.colorTo} 62%, ${a.colorTo} 100%)`,
  };
}

export function cardTextClass(a: CardAppearance): string {
  return a.textLight ? "text-white" : "text-slate-900";
}
