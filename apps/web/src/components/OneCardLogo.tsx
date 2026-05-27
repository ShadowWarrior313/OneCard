import Image from "next/image";
import { DEFAULT_CARDHOLDER_NAME } from "@/lib/userProfile";

export function OneCardLogo({
  showWordmark = false,
  cardholderName = DEFAULT_CARDHOLDER_NAME,
  variant = "mark",
  light = false,
}: {
  showWordmark?: boolean;
  cardholderName?: string;
  variant?: "mark" | "card";
  /** White wordmark for dark backgrounds */
  light?: boolean;
}) {
  if (variant === "card") {
    return (
      <div className="w-[7.5rem] drop-shadow-lg">
        <svg viewBox="0 0 184 116" className="h-auto w-full" aria-hidden>
          <rect x="2" y="2" width="180" height="112" rx="10" fill="#0a0a0a" />
          <rect x="148" y="14" width="22" height="16" rx="2.5" fill="#e8e8e8" />
          <text
            x="16"
            y="96"
            fill="#fafafa"
            fontSize="14"
            fontWeight="600"
            fontFamily="var(--font-inter), system-ui, sans-serif"
          >
            {cardholderName.toUpperCase()}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/brand-mark.png"
        alt=""
        width={88}
        height={56}
        className="h-7 w-auto"
        priority
      />
      {showWordmark && (
        <span
          className={`text-lg font-semibold tracking-tight ${
            light ? "text-white" : "text-brand-ink"
          }`}
        >
          OneCard
        </span>
      )}
    </span>
  );
}
