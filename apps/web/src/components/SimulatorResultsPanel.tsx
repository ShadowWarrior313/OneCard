"use client";

import { motion } from "framer-motion";
import type { CardProduct } from "@onecard/shared-types";
import type { RoutingDecision } from "@onecard/shared-types";
import type { MerchantPreset } from "@/data/merchants";
import { MerchantLogo } from "@/components/MerchantLogo";
import { MERCHANT_LOGO } from "@/data/merchantIcons";
import { formatDecimal, formatMultiplier } from "@/lib/formatNumber";
import { ArrowRight, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { RewardsComparisonTable } from "./RewardsComparisonTable";

export function SimulatorResultsPanel({
  merchant,
  sym,
  taxTotal,
  chargeAmount,
  cards,
  decision,
  businessBlock,
  purchaseType,
  defaultCardId,
}: {
  merchant: MerchantPreset;
  sym: string;
  taxTotal: number | null;
  chargeAmount: number;
  cards: CardProduct[];
  decision: RoutingDecision | null;
  businessBlock: "no-card" | "merchant" | null;
  purchaseType: string;
  defaultCardId: string | null;
}) {
  if (businessBlock) {
    return (
      <div className="oc-simulator-sidebar">
        <BusinessBlockMessage block={businessBlock} merchant={merchant} />
      </div>
    );
  }

  if (decision && taxTotal != null && taxTotal > 0) {
    return (
      <div className="oc-simulator-sidebar space-y-4">
        {purchaseType === "business" && (
          <p className="rounded-lg bg-brand-ink px-4 py-2.5 text-sm font-medium text-white">
            Business purchase — business card only
          </p>
        )}
        <div className="oc-simulator-highlight">
          <MerchantLogo merchant={merchant} size={MERCHANT_LOGO.hero} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              OneCard routes to
            </p>
            <p className="truncate text-base font-bold text-brand-ink sm:text-lg">
              {decision.selectedCardDisplayName}
            </p>
            <p className="text-sm text-brand-muted">
              {formatMultiplier(decision.multiplier)}{" "}
              {decision.category.replace(/_/g, " ")} · {sym}
              {formatDecimal(taxTotal, 1)}
            </p>
          </div>
        </div>
        <RewardsComparisonTable
          decision={decision}
          merchant={merchant}
          cards={cards}
          defaultCardId={defaultCardId}
          sym={sym}
          totalCharged={taxTotal}
        />
      </div>
    );
  }

  return (
    <div className="oc-simulator-sidebar">
      <SimulatorLivePreview
        merchant={merchant}
        sym={sym}
        chargeAmount={chargeAmount}
        cardCount={cards.length}
      />
    </div>
  );
}

function BusinessBlockMessage({
  block,
  merchant,
}: {
  block: "no-card" | "merchant";
  merchant: MerchantPreset;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <p className="text-lg font-bold text-brand-ink">
        {block === "no-card" ? "Set a business card first" : "Not allowed on business card"}
      </p>
      <p className="mt-2 text-sm text-amber-900/90">
        {block === "no-card" ? (
          <>
            <Link href="/wallet" className="font-semibold underline">
              Choose one in your wallet
            </Link>
            .
          </>
        ) : (
          <>
            <strong>{merchant.name}</strong> is blocked for business spending.
          </>
        )}
      </p>
    </div>
  );
}

function SimulatorLivePreview({
  merchant,
  sym,
  chargeAmount,
  cardCount,
}: {
  merchant: MerchantPreset;
  sym: string;
  chargeAmount: number;
  cardCount: number;
}) {
  const waitingForAmount = chargeAmount <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 bg-white p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
        Preview
      </p>

      <div className="mt-4 flex items-center gap-3">
        <MerchantLogo merchant={merchant} size={MERCHANT_LOGO.hero} />
        <div>
          <p className="font-bold text-brand-ink">{merchant.name}</p>
          <p className="text-xs text-brand-muted">
            {merchant.group} · MCC {merchant.mcc}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">
          Purchase total
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-brand-ink">
          {waitingForAmount ? (
            <span className="text-brand-muted">—</span>
          ) : (
            <>
              {sym}
              {chargeAmount.toFixed(2)}
            </>
          )}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-brand-body">
        <Wallet className="h-4 w-4 shrink-0 text-brand-muted" />
        <span>
          <strong>{cardCount}</strong> cards ready to route
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-lg bg-zinc-50 p-4">
        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-brand-muted" />
        <div>
          <p className="text-sm font-semibold text-brand-ink">
            {waitingForAmount
              ? "Enter an amount to see rewards"
              : "Calculating best card…"}
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            Pick a merchant and we&apos;ll compare earn rates across your wallet.
          </p>
        </div>
      </div>

      {cardCount === 0 && (
        <Link
          href="/wallet"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal"
        >
          Add cards to your wallet
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </motion.div>
  );
}
