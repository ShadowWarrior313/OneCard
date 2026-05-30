/**
 * POST /api/stripe/confirm-card
 *
 * Called after the client confirms a SetupIntent via Stripe.js.
 * Retrieves the resulting PaymentMethod from Stripe server-side,
 * extracts safe display metadata, and returns it to the client.
 *
 * OneCard stores ONLY: paymentMethodId, brand, last4, expMonth, expYear.
 * The full PAN and CVV are never requested, logged, or stored.
 *
 * Body: { paymentMethodId: string }
 * Returns: StoredCard (safe metadata only)
 */
import { stripe } from "@/lib/stripe";
import type { StoredCard } from "@/lib/stripe";
import { assertNoRawCardData, RawCardDataError } from "@/lib/assertNoRawCardData";
import { NextResponse } from "next/server";

const PM_ID_RE = /^pm_[a-zA-Z0-9_]{8,}$/;

export async function POST(request: Request): Promise<NextResponse> {
  let body: { paymentMethodId?: string };
  try {
    body = (await request.json()) as { paymentMethodId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Defense-in-depth: this route accepts only a Stripe token id, never card data.
  try {
    assertNoRawCardData(body);
  } catch (err) {
    if (err instanceof RawCardDataError) {
      console.error("[onecard/confirm-card] rejected request containing raw card field");
      return NextResponse.json({ error: "Raw card data is not accepted" }, { status: 400 });
    }
    throw err;
  }

  const pmId = body.paymentMethodId?.trim() ?? "";
  if (!PM_ID_RE.test(pmId)) {
    return NextResponse.json({ error: "Invalid payment method id" }, { status: 400 });
  }

  try {
    const pm = await stripe.paymentMethods.retrieve(pmId);

    if (pm.type !== "card" || !pm.card) {
      return NextResponse.json({ error: "Only card payment methods are supported" }, { status: 400 });
    }

    const stored: StoredCard = {
      paymentMethodId: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      createdAt: new Date().toISOString(),
    };

    // TODO: persist `stored` to your database keyed by authenticated user id.
    // For now we return it to the client to store in wallet state.
    return NextResponse.json({ card: stored });
  } catch (err) {
    console.error("[onecard/confirm-card] Stripe error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Could not retrieve card details" },
      { status: 500 },
    );
  }
}
