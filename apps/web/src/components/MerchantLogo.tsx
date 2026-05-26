"use client";

import { useMemo, useState } from "react";
import type { MerchantPreset } from "@/data/merchants";
import { merchantLucideIcon } from "@/data/merchantIcons";
import { MERCHANT_LOGO_FRAME } from "./BrandLogo";
import {
  resolveBrandLogoCandidates,
} from "@/lib/brandLogoClient";

function brandDomains(merchant: MerchantPreset): string[] {
  const list = [
    merchant.logoDomain,
    ...(merchant.logoDomainFallbacks ?? []),
  ].filter(Boolean) as string[];
  return [...new Set(list)];
}

function LucideMerchantMark({
  merchant,
  size,
  className = "",
}: {
  merchant: MerchantPreset;
  size: number;
  className?: string;
}) {
  const { Icon, iconClass } = merchantLucideIcon(merchant.id, merchant.group);
  const iconPx = Math.round(size * 0.5);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${MERCHANT_LOGO_FRAME} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon
        className={iconClass}
        style={{ width: iconPx, height: iconPx }}
        strokeWidth={2}
      />
    </span>
  );
}

function RemoteLogo({
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

export function MerchantLogo({
  merchant,
  size = 44,
  className = "",
}: {
  merchant: MerchantPreset;
  size?: number;
  className?: string;
}) {
  const domains = brandDomains(merchant);
  const candidates = useMemo(
    () =>
      resolveBrandLogoCandidates(domains, "light", Math.max(size * 2, 128), {
        merchantId: merchant.id,
      }),
    [domains.join("|"), merchant.id, size],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const remoteSrc = candidates[candidateIndex] ?? null;

  if (!remoteSrc) {
    return <LucideMerchantMark merchant={merchant} size={size} className={className} />;
  }

  return (
    <RemoteLogo
      src={remoteSrc}
      alt={merchant.name}
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
