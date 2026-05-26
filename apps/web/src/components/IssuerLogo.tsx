"use client";

import { useMemo, useState } from "react";
import { issuerBrandDomains } from "@/data/issuerDomains";
import { getCardTheme } from "@/data/cardThemes";
import { MERCHANT_LOGO_FRAME } from "./BrandLogo";
import { resolveBrandLogoCandidates } from "@/lib/brandLogoClient";

function IssuerLetterMark({
  issuer,
  cardId,
  size,
  className = "",
}: {
  issuer: string;
  cardId: string;
  size: number;
  className?: string;
}) {
  const theme = getCardTheme(cardId, issuer);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: theme.accent }}
      aria-hidden
    >
      {issuer.charAt(0)}
    </span>
  );
}

function RemoteIssuerLogo({
  src,
  alt,
  size,
  className = "",
  onError,
}: {
  src: string;
  alt: string;
  size: number;
  className?: string;
  onError?: () => void;
}) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden ${MERCHANT_LOGO_FRAME} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain p-1.5"
        referrerPolicy="no-referrer"
        onError={onError}
      />
    </span>
  );
}

export function IssuerLogo({
  issuer,
  cardId,
  size = 44,
  className = "",
}: {
  issuer: string;
  cardId: string;
  size?: number;
  className?: string;
}) {
  const domains = issuerBrandDomains(issuer);
  const candidates = useMemo(
    () =>
      resolveBrandLogoCandidates(domains, "light", Math.max(size * 2, 128), {
        issuer,
      }),
    [domains.join("|"), issuer, size],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const remoteSrc = candidates[candidateIndex] ?? null;

  if (!remoteSrc) {
    return (
      <IssuerLetterMark
        issuer={issuer}
        cardId={cardId}
        size={size}
        className={className}
      />
    );
  }

  return (
    <RemoteIssuerLogo
      src={remoteSrc}
      alt={issuer}
      size={size}
      className={className}
      onError={() => {
        if (candidateIndex + 1 < candidates.length) {
          setCandidateIndex((index) => index + 1);
        } else {
          setCandidateIndex(candidates.length);
        }
      }}
    />
  );
}
