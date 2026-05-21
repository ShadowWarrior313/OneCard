import type { RoutingMode, RoutingModeMetadata } from "@onecard/shared-types";

/**
 * Per-architecture metadata for investor docs and dashboard tooltips.
 * Does not change card selection math in v1 — separation of concerns.
 */
export function getModeMetadata(mode: RoutingMode): RoutingModeMetadata {
  switch (mode) {
    case "network_dependent":
      return {
        mode,
        estimatedLatencyMs: 800,
        settlementRisk: "medium",
        merchantAcceptance: "universal",
        rewardsAttributionAccuracy: "approximate",
        regulatoryNotes:
          "Requires network sponsorship + issuer BIN; subject to Visa/MC operating regulations and interchange.",
      };
    case "closed_loop":
      return {
        mode,
        estimatedLatencyMs: 200,
        settlementRisk: "high",
        merchantAcceptance: "limited",
        rewardsAttributionAccuracy: "delayed",
        regulatoryNotes:
          "OneCard holds settlement float; needs own acquirer/issuer stack or bank partner. Higher OSFI scrutiny on float.",
      };
    case "virtual_provisioning":
      return {
        mode,
        estimatedLatencyMs: 1200,
        settlementRisk: "low",
        merchantAcceptance: "digital_only",
        rewardsAttributionAccuracy: "exact",
        regulatoryNotes:
          "Uses underlying issuer tokenization (Stripe Issuing / bank APIs). In-store swipe without wallet not supported.",
      };
  }
}
