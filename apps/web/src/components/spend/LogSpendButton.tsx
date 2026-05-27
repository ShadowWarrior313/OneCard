"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PlusCircle } from "lucide-react";
import type { RoutingDecision } from "@onecard/shared-types";
import type { MerchantPreset } from "@/data/merchants";
import { useSpend } from "@/context/SpendContext";

export function LogSpendButton({
  merchant,
  amount,
  purchaseType,
  decision,
  defaultCardId,
}: {
  merchant: MerchantPreset;
  amount: number;
  purchaseType: "personal" | "business";
  decision: RoutingDecision;
  defaultCardId: string | null;
}) {
  const { recordSpend } = useSpend();
  const [logged, setLogged] = useState(false);

  function handleLog() {
    const defaultRewardCents =
      decision.estimatedRewardValueCents - decision.deltaVsDefaultCents;
    recordSpend({
      merchant,
      amount,
      purchaseType,
      decision,
      defaultCardId: defaultCardId ?? undefined,
      defaultRewardCents,
    });
    setLogged(true);
    window.setTimeout(() => setLogged(false), 2500);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleLog}
        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-zinc-50"
      >
        {logged ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            Logged to My Spend
          </>
        ) : (
          <>
            <PlusCircle className="h-4 w-4" />
            Log to My Spend
          </>
        )}
      </button>
      <Link
        href="/wallet/my-spend"
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal sm:w-auto"
      >
        View My Spend
      </Link>
    </div>
  );
}
