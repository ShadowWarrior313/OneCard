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
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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
