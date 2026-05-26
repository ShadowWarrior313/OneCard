"use client";

import type { CardNetwork } from "@onecard/shared-types";
import { useMemo, useState } from "react";
import {
  paymentNetworkIconCandidates,
  paymentNetworkIconUrl,
  type PaymentIconStyle,
} from "@/lib/paymentNetworkIcons";

export function PaymentNetworkLogo({
  network,
  size = 28,
  style = "flat-rounded",
  className = "",
}: {
  network: CardNetwork;
  size?: number;
  style?: PaymentIconStyle;
  className?: string;
}) {
  const candidates = useMemo(() => {
    const primary = paymentNetworkIconUrl(network, style);
    const rest = paymentNetworkIconCandidates(network).filter((u) => u !== primary);
    return [primary, ...rest];
  }, [network, style]);

  const [index, setIndex] = useState(0);
  const src = candidates[index] ?? candidates[0];

  if (!src) return null;

  const width = network === "mastercard" ? Math.round(size * 1.35) : size;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${network} logo`}
      className={`object-contain ${className}`}
      style={{ height: size, width }}
      referrerPolicy="no-referrer"
      onError={() => {
        if (index + 1 < candidates.length) setIndex((i) => i + 1);
      }}
    />
  );
}
