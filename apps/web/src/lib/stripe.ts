/**
 * Server-side Stripe singleton.
 * Import this ONLY from server components / API routes — never from client code.
 * The secret key is never exposed to the browser.
 *
 * NOTE: This is test-mode only. Real-money use requires:
 *   • Stripe onboarding (completed business verification)
 *   • A completed PCI SAQ A (or A-EP if you host any payment page)
 *   • Legal / privacy review for your jurisdiction
 *
 * Live `sk_live_` keys are refused by `assertStripeTestMode` on every payment
 * route — never rely on comments alone to keep checkout in sandbox.
 */
import Stripe from "stripe";
import { assertStripeTestMode } from "./assertStripeTestMode";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  // Warn loudly in development; in production the route will 500 naturally.
  console.warn("[onecard] STRIPE_SECRET_KEY is not set — Stripe routes will fail.");
} else if (!key.trim().startsWith("sk_test_")) {
  console.error(
    "[onecard] STRIPE_SECRET_KEY is not a test-mode key — payment routes will fail closed.",
  );
}

// Never construct the client with a live key even if a route forgets the assert.
const safeKey = key?.trim().startsWith("sk_test_") ? key.trim() : "sk_test_placeholder";

export const stripe = new Stripe(safeKey, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

export { assertStripeTestMode, StripeTestModeError } from "./assertStripeTestMode";

/** Safe card metadata — the ONLY card fields stored by OneCard. No PAN or CVV. */
export interface StoredCard {
  paymentMethodId: string; // Stripe PaymentMethod ID (pm_...)
  brand: string;           // "visa", "mastercard", "amex", etc.
  last4: string;           // last 4 digits — safe display metadata
  expMonth: number;
  expYear: number;
  label?: string;          // user-provided nickname, e.g. "My Cobalt"
  createdAt: string;       // ISO timestamp
}
