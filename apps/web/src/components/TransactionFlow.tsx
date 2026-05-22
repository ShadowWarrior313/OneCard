"use client";

import { PosTapAnimation } from "./PosTapAnimation";

/** How-it-works section — reuses hero POS animation + short caption */
export function TransactionFlow() {
  return (
    <div className="relative">
      <div className="mx-auto max-w-md">
        <PosTapAnimation />
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">
        One tap at the terminal → OneCard scans your wallet → charges the best
        underlying card → you see rewards instantly.
      </p>
    </div>
  );
}
