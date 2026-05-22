import Image from "next/image";

/**
 * OneCard brand — fanned B&W card stack (mark) + personalized black card (animation).
 */

type LogoVariant = "mark" | "card";

interface OneCardLogoProps {
  variant?: LogoVariant;
  className?: string;
  showWordmark?: boolean;
  /** Name embossed on the physical card (animation) */
  cardholderName?: string;
}

/** Chip on black card — light insert, top-right */
function ChipTopRight() {
  return (
    <rect
      x="0"
      y="0"
      width="22"
      height="16"
      rx="2.5"
      fill="#e8e8e8"
      stroke="#fafafa"
      strokeWidth="0.5"
    />
  );
}

/** Single black card for POS tap — chip top-right, cardholder name */
function PersonalCardSvg({
  className,
  cardholderName,
}: {
  className?: string;
  cardholderName: string;
}) {
  return (
    <svg
      viewBox="0 0 184 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`${cardholderName} — OneCard`}
    >
      <rect
        x="2"
        y="2"
        width="180"
        height="112"
        rx="10"
        fill="#0a0a0a"
        stroke="#0a0a0a"
        strokeWidth="2"
      />
      <g transform="translate(148, 14)">
        <ChipTopRight />
      </g>
      <text
        x="16"
        y="96"
        fill="#fafafa"
        fontSize="14"
        fontWeight="600"
        fontFamily="var(--font-dm-sans), system-ui, sans-serif"
        letterSpacing="0.04em"
        style={{ textTransform: "uppercase" }}
      >
        {cardholderName}
      </text>
    </svg>
  );
}

export function OneCardLogo({
  variant = "mark",
  className = "",
  showWordmark = false,
  cardholderName = "John Doe",
}: OneCardLogoProps) {
  if (variant === "card") {
    return (
      <div className={`oc-brand-card ${className}`}>
        <PersonalCardSvg
          className="h-full w-full"
          cardholderName={cardholderName}
        />
      </div>
    );
  }

  return (
    <span className={`oc-brand ${className}`}>
      <Image
        src="/brand-mark.png"
        alt=""
        width={88}
        height={56}
        className="oc-brand-mark"
        priority
      />
      {showWordmark && <span className="oc-brand-wordmark">OneCard</span>}
    </span>
  );
}
