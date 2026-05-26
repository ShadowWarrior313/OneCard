"use client";

import type { MerchantPreset } from "@/data/merchants";
import { merchantLucideIcon } from "@/data/merchantIcons";
import { BrandLogo } from "./BrandLogo";

function LucideMerchantMark({
  merchant,
  size,
  className = "",
}: {
  merchant: MerchantPreset;
  size: number;
  className?: string;
}) {
  const { Icon, bg, iconClass } = merchantLucideIcon(merchant.id, merchant.group);
  const iconPx = Math.round(size * 0.46);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200/90 ${bg} ${className}`}
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

export function MerchantLogo({
  merchant,
  size = 44,
  className = "",
}: {
  merchant: MerchantPreset;
  size?: number;
  className?: string;
}) {
  const localSrc = merchant.logoSrc;

  if (localSrc) {
    return (
      <BrandLogo
        src={localSrc}
        alt={merchant.name}
        size={size}
        className={className}
        fallback={<LucideMerchantMark merchant={merchant} size={size} className={className} />}
      />
    );
  }

  return <LucideMerchantMark merchant={merchant} size={size} className={className} />;
}
