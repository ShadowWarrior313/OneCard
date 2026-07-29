/**
 * POST /api/stripe/payment-intent
 *
 * Creates a Stripe PaymentIntent so the client can complete a purchase
 * entirely inside Stripe's hosted Payment Element. OneCard never sees the
 * raw PAN, CVV, or full expiry — they go directly browser → Stripe.
 *
 * TEST MODE ONLY. Use Stripe test cards (e.g. 4242 4242 4242 4242).
 * Real-money use requires Stripe live onboarding + a completed PCI SAQ.
 *
 * Body (optional): { amountCents?: number; currency?: string }
 *   - amountCents is validated and clamped server-side; the client is never trusted.
 * Returns: { clientSecret: string; amountCents: number; currency: string }
 */
import { stripe } from "@/lib/stripe";
import { assertNoRawCardData, RawCardDataError } from "@/lib/assertNoRawCardData";
import { assertStripeTestMode, StripeTestModeError } from "@/lib/assertStripeTestMode";
import { NextResponse } from "next/server";

// Simple in-memory rate limit: max 10 PaymentIntents per IP per minute.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

// Server-side validation — never trust a client-supplied amount blindly.
const ALLOWED_CURRENCIES = new Set(["cad", "usd"]);
const DEFAULT_AMOUNT_CENTS = 100; // CA$1.00 default mock purchase
const MIN_AMOUNT_CENTS = 50; // Stripe minimum chargeable amount
const MAX_AMOUNT_CENTS = 99_999; // CA$999.99 cap for this test page

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertStripeTestMode();
  } catch (err) {
    if (err instanceof StripeTestModeError) {
      console.error("[onecard/payment-intent] refused non-test Stripe secret key");
      return NextResponse.json(
        { error: "Stripe test mode is required" },
        { status: 503 },
      );
    }
    throw err;
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsed: { amountCents?: unknown; currency?: unknown } = {};
  try {
    const raw = await request.text();
    if (raw.trim()) {
      parsed = JSON.parse(raw) as typeof parsed;
      // Defense-in-depth: this route accepts an amount only, never card data.
      assertNoRawCardData(parsed);
    }
  } catch (err) {
    if (err instanceof RawCardDataError) {
      console.error("[onecard/payment-intent] rejected request containing raw card field");
      return NextResponse.json({ error: "Raw card data is not accepted" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate + clamp the amount; fall back to safe defaults.
  let amountCents = DEFAULT_AMOUNT_CENTS;
  if (typeof parsed.amountCents === "number" && Number.isInteger(parsed.amountCents)) {
    amountCents = Math.min(Math.max(parsed.amountCents, MIN_AMOUNT_CENTS), MAX_AMOUNT_CENTS);
  }
  const currency =
    typeof parsed.currency === "string" && ALLOWED_CURRENCIES.has(parsed.currency.toLowerCase())
      ? parsed.currency.toLowerCase()
      : "cad";

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      return NextResponse.json(
        { error: "Could not create payment intent" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      amountCents,
      currency,
    });
  } catch (err) {
    // Never forward raw Stripe error messages — they may contain internal details.
    console.error("[onecard/payment-intent] Stripe error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Could not initialise payment" },
      { status: 500 },
    );
  }
}
