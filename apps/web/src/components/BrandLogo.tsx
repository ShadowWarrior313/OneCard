"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type LogoSurface = "dark" | "light" | "warm";

export const MERCHANT_LOGO_FRAME =
  "rounded-xl border border-brand-purple/15 bg-gradient-to-br from-white to-brand-purple-soft/40";

export function BrandLogo({
  src,
  alt,
  size = 44,
  fallback,
  surface = "light",
  fill = false,
  className = "",
  rounded = "xl",
}: {
  src?: string;
  alt: string;
  size?: number;
  fallback?: ReactNode;
  className?: string;
  rounded?: "lg" | "xl" | "2xl";
  surface?: LogoSurface;
  fill?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const radius = rounded === "2xl" ? "rounded-2xl" : rounded === "lg" ? "rounded-lg" : "rounded-xl";
  const frame =
    surface === "dark"
      ? `bg-zinc-900 border-zinc-700/80 ${radius}`
      : surface === "warm"
        ? `${MERCHANT_LOGO_FRAME}`
        : `bg-white border-slate-200/80 ${radius}`;

  if (!src || failed) {
    return (
      <>{fallback ?? (
        <span
          className={`inline-flex shrink-0 items-center justify-center bg-slate-100 font-bold text-brand-muted ${radius} border border-slate-200/80 ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.32 }}
          aria-hidden
        >
          {alt.charAt(0)}
        </span>
      )}</>
    );
  }

  const inset = fill ? 0 : Math.max(4, Math.round(size * 0.12));
  const inner = size - inset * 2;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border ${frame} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={inner || size}
        height={inner || size}
        className={fill ? "h-full w-full object-contain" : "object-contain"}
        style={
          fill
            ? { width: "100%", height: "100%" }
            : {
                width: inner,
                height: inner,
                maxWidth: "100%",
                maxHeight: "100%",
              }
        }
        onError={() => setFailed(true)}
        unoptimized
      />
    </span>
  );
}
