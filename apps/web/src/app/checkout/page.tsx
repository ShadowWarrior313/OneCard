"use client";

/**
 * /checkout — test-mode mock purchase.
 *
 * Flow:
 *   1. Page mounts → POST /api/stripe/payment-intent → receives clientSecret
 *   2. Stripe Payment Element (hosted iframe) collects the card
 *   3. CheckoutForm calls stripe.confirmPayment() → Stripe charges the test card
 *   4. On success we show the PaymentIntent id (pi_…) — the only value our app sees
 *
 * No PAN/CVV/expiry ever touches OneCard's JS, state, or servers. Nothing is
 * persisted client-side. TEST MODE ONLY (requires Stripe test keys in env).
 */
import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutForm } from "@/components/CheckoutForm";

// Publishable key — safe to expose to the browser.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

const MOCK_AMOUNT_CENTS = 100; // CA$1.00
const MOCK_CURRENCY = "cad";

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountLabel, setAmountLabel] = useState(
    formatAmount(MOCK_AMOUNT_CENTS, MOCK_CURRENCY),
  );
  const [fetchError, setFetchError] = useState(false);
  const [paidId, setPaidId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: MOCK_AMOUNT_CENTS,
        currency: MOCK_CURRENCY,
      }),
    })
      .then((r) => r.json())
      .then((data: { clientSecret?: string; amountCents?: number; currency?: string }) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          if (data.amountCents && data.currency) {
            setAmountLabel(formatAmount(data.amountCents, data.currency));
          }
        } else {
          setFetchError(true);
        }
      })
      .catch(() => setFetchError(true));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Test purchase
        </p>
        <h1 className="text-2xl font-black text-slate-900">
          Checkout · {amountLabel}
        </h1>
        <p className="text-sm text-slate-500">
          A sandbox purchase to verify the end-to-end card flow. No real money moves.
        </p>
      </header>

      {paidId ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-bold text-green-800">Payment succeeded ✓</p>
          <p className="mt-1 break-all text-xs text-green-700">
            PaymentIntent: <code>{paidId}</code>
          </p>
          <p className="mt-2 text-xs text-green-700">
            OneCard only ever received this <code>pi_…</code> id — never the card number.
          </p>
        </div>
      ) : fetchError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-800">
            Could not start a test payment.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            This page needs Stripe <strong>test</strong> keys in{" "}
            <code>apps/web/.env.local</code> —{" "}
            <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and{" "}
            <code>STRIPE_SECRET_KEY</code> (both <code>…_test_…</code>). Restart the
            dev server after adding them.
          </p>
        </div>
      ) : !clientSecret ? (
        <p className="animate-pulse text-sm text-slate-500">
          Preparing secure checkout…
        </p>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: { colorPrimary: "#0b0b0f", borderRadius: "12px" },
            },
          }}
        >
          <CheckoutForm
            amountLabel={amountLabel}
            onSuccess={(id) => setPaidId(id)}
          />
        </Elements>
      )}
    </main>
  );
}
