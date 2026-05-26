"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export function BrandLogo({
  src,
  alt,
  size = 44,
  fallback,
  className = "",
  rounded = "xl",
}: {
  src?: string;
  alt: string;
  size?: number;
  fallback?: ReactNode;
  className?: string;
  rounded?: "lg" | "xl" | "2xl";
}) {
  const [failed, setFailed] = useState(false);
  const radius = rounded === "2xl" ? "rounded-2xl" : rounded === "lg" ? "rounded-lg" : "rounded-xl";

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

  const pad = Math.max(4, Math.round(size * 0.12));

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/80 bg-white ${radius} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size - pad * 2}
        height={size - pad * 2}
        className="object-contain"
        style={{
          width: size - pad * 2,
          height: size - pad * 2,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
        onError={() => setFailed(true)}
        unoptimized
      />
    </span>
  );
}
