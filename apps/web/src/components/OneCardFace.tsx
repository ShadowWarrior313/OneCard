"use client";

import { useUserProfile } from "@/context/UserProfileContext";

function nameSizeClass(name: string): string {
  const len = name.length;
  if (len > 18) return "text-[0.62rem] leading-[1.2] tracking-[0.03em]";
  if (len > 14) return "text-[0.68rem] leading-[1.22] tracking-[0.04em]";
  if (len > 10) return "text-xs leading-[1.25] tracking-[0.05em]";
  return "text-sm leading-[1.3] tracking-wide";
}

/** Homepage showcase width — matches CardShowcaseSection */
export const ONECARD_SHOWCASE_WIDTH_REM = 13.75;
export const ONECARD_SHOWCASE_WIDTH_PX = 220;
export const ONECARD_SHOWCASE_HEIGHT_PX = ONECARD_SHOWCASE_WIDTH_PX / 1.586;

type OneCardFaceProps = {
  className?: string;
  /** Fixed homepage type scale (ignores viewport breakpoints) */
  variant?: "responsive" | "showcase";
};

/** Shared OneCard front — landscape layout, spacing, and type scale */
export function OneCardFace({ className = "", variant = "responsive" }: OneCardFaceProps) {
  const { cardholderName } = useUserProfile();
  const showcase = variant === "showcase";

  return (
    <div
      className={`relative overflow-hidden rounded-[1.15rem] shadow-[0_24px_64px_rgba(14,116,144,0.28)] ring-1 ring-white/20 ${
        showcase ? "h-full w-full" : "aspect-[1.586] w-full"
      } ${className}`.trim()}
      style={{
        background: "linear-gradient(145deg, #1a1a1c 0%, #0a0a0b 42%, #18181b 100%)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-violet-500/10" />
      <div
        className={`relative flex h-full min-h-0 flex-col text-white ${
          showcase ? "p-[1.15rem]" : "p-4 sm:p-[1.15rem]"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-2">
          <div
            className={`shrink-0 rounded-md bg-gradient-to-br from-amber-200/95 to-amber-500/90 shadow-inner ${
              showcase ? "h-6 w-9" : "h-5 w-8 sm:h-6 sm:w-9"
            }`}
          />
          <span
            className={`font-bold uppercase tracking-[0.22em] text-white/40 ${
              showcase ? "text-[0.55rem]" : "text-[0.5rem] sm:text-[0.55rem]"
            }`}
          >
            OneCard
          </span>
        </div>

        <div
          className={`flex min-h-0 flex-1 flex-col justify-center ${
            showcase ? "py-2.5" : "py-2 sm:py-2.5"
          }`}
        >
          <p
            className={`font-medium uppercase tracking-[0.16em] text-white/45 ${
              showcase ? "text-[0.62rem]" : "text-[0.58rem] sm:text-[0.62rem]"
            }`}
          >
            Universal wallet
          </p>
          <p
            className={`mt-1.5 max-w-[92%] font-semibold text-balance ${nameSizeClass(cardholderName)}`}
          >
            {cardholderName}
          </p>
        </div>

        <div className="flex shrink-0 items-end justify-between gap-2 pt-0.5">
          <span
            className={`font-mono text-white/35 ${
              showcase ? "text-[0.62rem]" : "text-[0.58rem] sm:text-[0.62rem]"
            }`}
          >
            Tap · Route · Earn
          </span>
          <span className="flex shrink-0 gap-0.5">
            <span
              className={`rounded-full bg-red-500/90 ${
                showcase ? "h-4 w-4" : "h-3.5 w-3.5 sm:h-4 sm:w-4"
              }`}
            />
            <span
              className={`-ml-1.5 rounded-full bg-amber-400/90 ${
                showcase ? "-ml-2 h-4 w-4" : "h-3.5 w-3.5 sm:-ml-2 sm:h-4 sm:w-4"
              }`}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
