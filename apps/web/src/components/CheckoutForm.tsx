"use client";

/**
 * CheckoutForm — completes a purchase via Stripe Payment Element.
 *
 * Card details are entered directly into Stripe's hosted iframe and confirmed
 * with stripe.confirmPayment(). The raw PAN, CVV, and expiry NEVER pass through
 * OneCard's JavaScript, state, or servers — they go browser → Stripe only.
 * OneCard's server sees only the PaymentIntent id (pi_…), never card data.
 *
 * TEST MODE ONLY — use Stripe test cards (e.g. 4242 4242 4242 4242,
 * any future expiry, any CVC, any postal code).
 */
import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  amountLabel: string;
  onSuccess: (paymentIntentId: string) => void;
}

export function CheckoutForm({ amountLabel, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatus("submitting");
    setErrorMessage(null);

    // Stripe confirms the PaymentIntent — card data goes directly to Stripe, never to OneCard.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      // Stripe returns user-safe error messages; safe to display.
      setErrorMessage(error.message ?? "Something went wrong.");
      setStatus("error");
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
      return;
    }

    // Any other status (requires_action handled by Stripe redirect, processing, etc.)
    setErrorMessage(
      `Payment did not complete (status: ${paymentIntent?.status ?? "unknown"}). Please try again.`,
    );
    setStatus("error");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Stripe's hosted iframe — card data never enters OneCard's DOM */}
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Card details are entered directly into Stripe&apos;s secure form and never
        touch OneCard&apos;s servers. This is a <strong>test-mode</strong> purchase —
        no real money moves. Use a Stripe test card such as{" "}
        <code>4242 4242 4242 4242</code>.
      </p>

      <button
        type="submit"
        disabled={status === "submitting" || !stripe}
        className="w-full rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {status === "submitting" ? "Processing…" : `Pay ${amountLabel}`}
      </button>
    </form>
  );
}
