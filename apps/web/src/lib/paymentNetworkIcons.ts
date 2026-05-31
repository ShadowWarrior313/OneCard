import type { CardNetwork } from "@onecard/shared-types";

/**
 * Payment network marks from svg-credit-card-payment-icons (Apache-2.0).
 * @see https://github.com/aaronfagan/svg-credit-card-payment-icons
 */
export type PaymentIconStyle =
  | "logo"
  | "flat-rounded"
  | "logo-border"
  | "mono"
  | "mono-outline";

const REPO =
  "https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main";

const NETWORK_FILE: Record<CardNetwork, string> = {
  visa: "visa",
  mastercard: "mastercard",
  amex: "amex",
  discover: "discover",
};

export function paymentNetworkIconUrl(
  network: CardNetwork,
  style: PaymentIconStyle = "flat-rounded",
): string {
  const file = NETWORK_FILE[network];
  return `${REPO}/${style}/${file}.svg`;
}

export function paymentNetworkIconCandidates(
  network: CardNetwork,
): string[] {
  const styles: PaymentIconStyle[] = ["flat-rounded", "logo", "logo-border", "mono"];
  return styles.map((style) => paymentNetworkIconUrl(network, style));
}

export function genericCardIconUrl(style: PaymentIconStyle = "flat-rounded"): string {
  return `${REPO}/${style}/generic.svg`;
}
