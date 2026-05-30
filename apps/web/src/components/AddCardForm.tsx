"use client";

/**
 * AddCardForm — card entry via Stripe Payment Element.
 *
 * Card details are entered directly into Stripe's hosted iframe.
 * Raw PAN, CVV, and expiry NEVER pass through OneCard's JavaScript,
 * state, or servers — they go browser → Stripe servers only.
 *
 * Flow:
 *   1. Component mounts → POST /api/stripe/setup-intent → receives clientSecret
 *   2. User fills Stripe's Payment Element (hosted by Stripe, CSP-protected)
 *   3. User submits → stripe.confirmSetup() → Stripe confirms & returns PaymentMethod id
 *   4. POST /api/stripe/confirm-card with paymentMethodId → server fetches safe
 *      metadata (brand, last4, expMonth, expYear) from Stripe → returned to UI
 *   5. Safe metadata stored in wallet; no PAN or CVV ever touched by OneCard
 */
import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { StoredCard } from "@/lib/stripe";

// Publishable key — safe to expose to the browser.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

interface AddCardFormProps {
  onSuccess: (card: StoredCard) => void;
  onCancel: () => void;
}

function CardEntryForm({ onSuccess, onCancel }: AddCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatus("submitting");
    setErrorMessage(null);

    // Stripe confirms the SetupIntent — card data goes directly to Stripe, never to OneCard.
    const { error, setupIntent } = await stripe.confirmSetup({
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

    const pmId =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;

    if (!pmId) {
      setErrorMessage("Card setup did not complete. Please try again.");
      setStatus("error");
      return;
    }

    // Retrieve safe display metadata server-side (brand, last4, exp).
    const res = await fetch("/api/stripe/confirm-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId: pmId }),
    });

    if (!res.ok) {
      setErrorMessage("Card was saved with Stripe but we could not load its details. Please refresh.");
      setStatus("error");
      return;
    }

    const { card } = (await res.json()) as { card: StoredCard };
    onSuccess(card);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Stripe's hosted iframe — card data never enters OneCard's DOM */}
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { applePay: "auto", googlePay: "auto" },
          }}
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Card details are entered directly into Stripe&apos;s secure form and
        never touch OneCard&apos;s servers. OneCard stores only your card brand,
        last 4 digits, and expiry for display purposes.
      </p>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === "submitting" || !stripe}
          className="flex-1 rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {status === "submitting" ? "Saving…" : "Save card"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AddCardForm({ onSuccess, onCancel }: AddCardFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/setup-intent", { method: "POST" })
      .then((r) => r.json())
      .then((data: { clientSecret?: string }) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setFetchError(true);
      })
      .catch(() => setFetchError(true));
  }, []);

  if (fetchError) {
    return (
      <p className="text-sm text-red-600">
        Could not initialise card setup. Please try again later.
      </p>
    );
  }

  if (!clientSecret) {
    return (
      <p className="animate-pulse text-sm text-slate-500">
        Preparing secure card form…
      </p>
    );
  }

  return (
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
      <CardEntryForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
