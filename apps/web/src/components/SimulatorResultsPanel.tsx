"use client";

import { motion } from "framer-motion";
import type { CardProduct } from "@onecard/shared-types";
import type { RoutingDecision } from "@onecard/shared-types";
import type { MerchantPreset } from "@/data/merchants";
import { MerchantLogo } from "@/components/MerchantLogo";
import { MERCHANT_LOGO } from "@/data/merchantIcons";
import { formatDecimal, formatMultiplier } from "@/lib/formatNumber";
import { ArrowRight, Sparkles, TrendingUp, Wallet } from "lucide-react";
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
          <p className="rounded-xl bg-brand-charcoal px-4 py-2.5 text-sm font-medium text-white">
            Business purchase — business card only
          </p>
        )}
        <div className="oc-simulator-highlight">
          <MerchantLogo merchant={merchant} size={MERCHANT_LOGO.hero} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-ocean">
              OneCard routes to
            </p>
            <p className="truncate text-lg font-bold text-brand-ink">
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
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-center">
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
      className="relative overflow-hidden rounded-2xl border border-brand-purple/15 bg-gradient-to-br from-brand-purple-soft/60 via-white to-brand-ocean-soft/50 p-6 shadow-card"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-purple/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-brand-ocean/15 blur-2xl" />

      <div className="relative">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-purple">
          <Sparkles className="h-3.5 w-3.5" />
          Live preview
        </p>

        <div className="mt-5 flex items-center gap-3">
          <MerchantLogo merchant={merchant} size={MERCHANT_LOGO.hero} />
          <div>
            <p className="font-bold text-brand-ink">{merchant.name}</p>
            <p className="text-xs text-brand-muted">
              {merchant.group} · MCC {merchant.mcc}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white/70 p-4 ring-1 ring-brand-purple/10 backdrop-blur-sm">
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
          <Wallet className="h-4 w-4 shrink-0 text-brand-ocean" />
          <span>
            <strong>{cardCount}</strong> cards ready to route
          </span>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl bg-brand-charcoal/95 p-4 text-white shadow-lift">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-brand-mint" />
          <div>
            <p className="text-sm font-semibold">
              {waitingForAmount
                ? "Enter an amount to see rewards"
                : "Calculating best card…"}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Pick a merchant and we&apos;ll compare earn rates across your wallet.
            </p>
          </div>
        </div>

        {cardCount === 0 && (
          <Link
            href="/wallet"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
          >
            Add cards to your wallet
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
