/**
 * POST /api/stripe/setup-intent
 *
 * Creates a Stripe SetupIntent so the client can collect card details
 * entirely inside Stripe's hosted Payment Element. OneCard never sees
 * the raw PAN, CVV, or full expiry — they go directly browser → Stripe.
 *
 * Returns: { clientSecret: string }
 * The client uses this secret to confirm the SetupIntent via Stripe.js.
 */
import { stripe } from "@/lib/stripe";
import { assertNoRawCardData, RawCardDataError } from "@/lib/assertNoRawCardData";
import { assertStripeTestMode, StripeTestModeError } from "@/lib/assertStripeTestMode";
import { NextResponse } from "next/server";

// Simple in-memory rate limit: max 5 SetupIntents per IP per minute.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertStripeTestMode();
  } catch (err) {
    if (err instanceof StripeTestModeError) {
      console.error("[onecard/setup-intent] refused non-test Stripe secret key");
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

  // Defense-in-depth: this route takes no card data; reject any that is sent.
  try {
    const raw = await request.text();
    if (raw.trim()) assertNoRawCardData(JSON.parse(raw));
  } catch (err) {
    if (err instanceof RawCardDataError) {
      console.error("[onecard/setup-intent] rejected request containing raw card field");
      return NextResponse.json({ error: "Raw card data is not accepted" }, { status: 400 });
    }
    // Non-JSON / empty bodies are fine — this route does not require one.
  }

  try {
    const setupIntent = await stripe.setupIntents.create({
      usage: "off_session",
      automatic_payment_methods: { enabled: true },
    });

    if (!setupIntent.client_secret) {
      return NextResponse.json(
        { error: "Could not create setup intent" },
        { status: 500 },
      );
    }

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    // Never forward raw Stripe error messages — they may contain internal details.
    console.error("[onecard/setup-intent] Stripe error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Could not initialise card setup" },
      { status: 500 },
    );
  }
}
