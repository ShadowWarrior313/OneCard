"use client";

import { useEffect, useState } from "react";
import { issuerBrandDomains } from "@/data/issuerDomains";
import { getCardTheme } from "@/data/cardThemes";
import { MERCHANT_LOGO_FRAME } from "./BrandLogo";
import {
  brandLogoCacheKey,
  fetchBrandLogo,
  getCachedBrandLogo,
} from "@/lib/brandLogoClient";

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
        className="h-full w-full object-contain"
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
  const cacheKey = brandLogoCacheKey(domains);
  const [remoteSrc, setRemoteSrc] = useState<string | null>(() => {
    const cached = getCachedBrandLogo(domains);
    return cached === undefined ? null : cached;
  });
  const [remoteFailed, setRemoteFailed] = useState(false);
  const [loading, setLoading] = useState(
    () => domains.length > 0 && getCachedBrandLogo(domains) === undefined,
  );

  useEffect(() => {
    if (!domains.length) return;

    let active = true;
    setRemoteFailed(false);

    fetchBrandLogo(domains).then((src) => {
      if (!active) return;
      setRemoteSrc(src);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [cacheKey]);

  if (loading) {
    return (
      <span
        className={`inline-block shrink-0 animate-pulse ${MERCHANT_LOGO_FRAME} ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  if (remoteSrc && !remoteFailed) {
    return (
      <RemoteIssuerLogo
        src={remoteSrc}
        alt={issuer}
        size={size}
        className={className}
        onError={() => setRemoteFailed(true)}
      />
    );
  }

  return (
    <IssuerLetterMark
      issuer={issuer}
      cardId={cardId}
      size={size}
      className={className}
    />
  );
}
