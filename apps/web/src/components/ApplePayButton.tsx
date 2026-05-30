"use client";

/**
 * ApplePayButton — Apple Pay (and Google Pay) via Stripe Payment Request Button.
 *
 * Apple's sheet collects the card; OneCard never sees the PAN.
 * The resulting PaymentMethod is verified server-side before being stored.
 *
 * Apple Pay requirements (production):
 *   1. Your domain must be verified with Apple via Stripe:
 *      stripe.com/docs/stripe-js/elements/payment-request-button#verifying-your-domain-with-apple-pay
 *   2. Download the domain-association file from the Stripe dashboard and host it at:
 *      https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
 *   3. Site must be served over HTTPS.
 *   4. Complete Stripe business verification (not required for test mode).
 */
import { useEffect, useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import type { PaymentRequest } from "@stripe/stripe-js";
import type { StoredCard } from "@/lib/stripe";

interface ApplePayButtonProps {
  amountCents: number;
  currency: string;
  label: string;
  onSuccess: (card: StoredCard) => void;
  onError: (message: string) => void;
}

export function ApplePayButton({
  amountCents,
  currency,
  label,
  onSuccess,
  onError,
}: ApplePayButtonProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "CA",
      currency: currency.toLowerCase(),
      total: { label, amount: amountCents },
      requestPayerName: false,
      requestPayerEmail: false,
    });

    void pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setAvailable(true);
      }
    });

    pr.on("paymentmethod", async (ev) => {
      // Confirm server-side using the paymentMethodId — never the raw card.
      try {
        const res = await fetch("/api/stripe/confirm-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethodId: ev.paymentMethod.id }),
        });

        if (!res.ok) {
          ev.complete("fail");
          onError("Could not confirm card with server.");
          return;
        }

        ev.complete("success");
        const { card } = (await res.json()) as { card: StoredCard };
        onSuccess(card);
      } catch {
        ev.complete("fail");
        onError("An error occurred. Please try again.");
      }
    });

    return () => {
      pr.off("paymentmethod");
    };
  }, [stripe, amountCents, currency, label, onSuccess, onError]);

  if (!available || !paymentRequest) return null;

  // Render a plain button that triggers the Payment Request sheet.
  // For a styled Apple/Google Pay button, use @stripe/react-stripe-js PaymentRequestButtonElement.
  return (
    <button
      type="button"
      onClick={() => paymentRequest.show()}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white"
      aria-label="Pay with Apple Pay or Google Pay"
    >
      <span aria-hidden="true">🍎</span> Pay with Apple Pay / Google Pay
    </button>
  );
}
