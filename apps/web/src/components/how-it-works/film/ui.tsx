"use client";

/**
 * Shared in-stage UI primitives for the film.
 * All sized in absolute stage pixels (the stage is scaled as a whole).
 */
import type { ReactNode } from "react";

export function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="flex h-9 items-center gap-3 border-b border-zinc-200 bg-zinc-100 px-4">
      <div className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex h-6 flex-1 items-center gap-2 rounded-md bg-white px-3 text-[12px] font-medium text-zinc-500 ring-1 ring-zinc-200">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 10V8a6 6 0 1112 0v2" stroke="#a1a1aa" strokeWidth="2" />
          <rect x="4" y="10" width="16" height="10" rx="2" fill="#d4d4d8" />
        </svg>
        {url}
      </div>
    </div>
  );
}

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full w-full rounded-[2.6rem] bg-[#0a0a0b] p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-white">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "mint",
}: {
  children: ReactNode;
  tone?: "mint" | "purple" | "ink";
}) {
  const tones = {
    mint: "bg-brand-mint-soft text-emerald-700 ring-emerald-200",
    purple: "bg-brand-purple-soft text-brand-purple-dark ring-violet-200",
    ink: "bg-zinc-900 text-white ring-zinc-700",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function CardChip() {
  return <span className="block h-5 w-7 rounded-[5px] bg-gradient-to-br from-amber-200 to-amber-500" />;
}
