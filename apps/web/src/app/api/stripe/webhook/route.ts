/**
 * POST /api/stripe/webhook
 *
 * Receives and verifies Stripe webhook events.
 * Signature is verified with the STRIPE_WEBHOOK_SECRET before any
 * payload is processed — unauthenticated payloads are rejected (400).
 * Missing/empty secrets fail closed (503): Stripe's constructEvent accepts
 * an empty secret, which would otherwise treat attacker-signed payloads as valid.
 *
 * Sensitive fields are never logged. Only the event type and id are logged.
 *
 * To test locally:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 */
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    // Signature mismatch — reject without logging the body (may contain PII).
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  // Log only the event type and id — never the full payload.
  console.log(`[onecard/webhook] ${event.type} ${event.id}`);

  switch (event.type) {
    case "setup_intent.succeeded": {
      // Card was saved successfully. In production: mark the PaymentMethod
      // as active in the user's account. No PAN/CVV is present in this event.
      break;
    }
    case "setup_intent.setup_failed": {
      // Card setup failed (e.g. declined). Log type only; do not log the error details.
      console.warn(`[onecard/webhook] setup_intent.setup_failed ${event.id}`);
      break;
    }
    case "payment_method.attached": {
      // A PaymentMethod was attached to a Customer. Safe to use pm.card.last4 etc.
      break;
    }
    case "payment_method.detached": {
      // PaymentMethod removed — purge from local storage if persisted.
      break;
    }
    case "payment_intent.succeeded": {
      // Future: mark a charge as settled in the user's transaction history.
      break;
    }
    case "payment_intent.payment_failed": {
      // Future: notify the user that a scheduled payment failed.
      break;
    }
    default:
      // Unhandled event types are acknowledged without error.
      break;
  }

  return NextResponse.json({ received: true });
}
