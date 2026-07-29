/**
 * Fail-closed guard: OneCard's Stripe purchase/setup paths are TEST MODE ONLY.
 *
 * PaymentIntent and SetupIntent routes must never talk to Stripe live mode. A
 * mis-set `STRIPE_SECRET_KEY=sk_live_…` would create real charges / collect live
 * cards despite every route being documented as sandbox-only.
 *
 * Verified by scripts/security-check.ts (Check 11).
 */

export class StripeTestModeError extends Error {
  constructor(message = "Stripe live keys are not allowed; configure a sk_test_ secret key") {
    super(message);
    this.name = "StripeTestModeError";
  }
}

/**
 * Reject anything that is not an explicit Stripe test-mode secret key.
 * Missing/blank keys fail closed too — do not fall through to the live API.
 */
export function assertStripeTestMode(
  secretKey: string | undefined = process.env.STRIPE_SECRET_KEY,
): void {
  const key = secretKey?.trim() ?? "";
  if (!key.startsWith("sk_test_")) {
    throw new StripeTestModeError();
  }
}
