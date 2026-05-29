"use client";

import type { ReactNode } from "react";

/** iPhone 15 proportions (~390×844) for marketing demo scenes */
const PHONE_WIDTH = "11rem";

export function DemoPhoneShell({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: PHONE_WIDTH }}>
      <div
        className="rounded-[2.25rem] border-[3px] border-zinc-600 bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800 p-[5px] shadow-[0_16px_48px_rgba(15,23,42,0.22)]"
        style={{ width: PHONE_WIDTH, height: "23.75rem" }}
      >
        <div
          className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.85rem] ${
            dark ? "bg-black" : "bg-[#f6f5f2]"
          }`}
        >
          <div className="flex shrink-0 justify-center pt-2.5 pb-1">
            <span
              className={`h-[1.125rem] w-[4.25rem] rounded-full ${
                dark ? "bg-zinc-800" : "bg-black"
              }`}
              aria-hidden
            />
          </div>

          <div
            className={`flex shrink-0 items-center justify-between px-4 pb-1 text-[0.5625rem] font-semibold leading-none ${
              dark ? "text-white/75" : "text-brand-ink"
            }`}
          >
            <span className="tabular-nums">9:41</span>
            <span className="flex items-center gap-1 opacity-80">
              <svg viewBox="0 0 16 12" className="h-2.5 w-3" aria-hidden>
                <path
                  fill="currentColor"
                  d="M1 9.5h1.5V12H1V9.5zm3-2.5h1.5V12H4V7zm3-2h1.5V12H7V5zm3-2.5h1.5V12H10V2.5zm3-1h1.5V12h-1.5V1.5z"
                />
              </svg>
              <svg viewBox="0 0 16 12" className="h-2.5 w-3.5" aria-hidden>
                <path
                  fill="currentColor"
                  d="M0 4.5C2.5 2 5.5 0.5 8 0.5s5.5 1.5 8 4v1.5c-2.5 2-5.5 3.5-8 3.5S2.5 8 0 6V4.5z"
                />
              </svg>
              <span className="tabular-nums">100%</span>
            </span>
          </div>

          <div
            className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
          >
            {children}
          </div>

          <div className="flex shrink-0 justify-center py-2">
            <span
              className={`h-[4px] w-[5.5rem] rounded-full ${
                dark ? "bg-white/30" : "bg-black/20"
              }`}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
