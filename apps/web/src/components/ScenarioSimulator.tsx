"use client";

import { routeTransaction } from "@onecard/rewards-engine";
import type { RoutingDecision, RoutingMode } from "@onecard/shared-types";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  MERCHANT_GROUPS,
  MERCHANT_PRESETS,
  merchantsInGroup,
} from "@/data/merchants";
import {
  CA_PROVINCES,
  US_STATES,
  computeTax,
  currencySymbol,
  defaultRegion,
  type TaxCountry,
} from "@/lib/taxes";
import { MerchantLogo } from "@/components/MerchantLogo";
import { MERCHANT_LOGO, MERCHANT_GROUP_STYLE } from "@/data/merchantIcons";
import { RewardsComparisonTable } from "@/components/RewardsComparisonTable";
import {
  businessRoutingExclusions,
  isBusinessMerchantAllowed,
  type PurchaseType,
} from "@/lib/businessSpend";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  Calculator,
  CreditCard,
  DollarSign,
  FlaskConical,
  Globe,
  MapPin,
  Receipt,
  Route,
  Smartphone,
  Store,
  User,
  Wallet,
  Lock,
  Network,
} from "lucide-react";

const ROUTING_MODES: {
  id: RoutingMode;
  label: string;
  icon: typeof Smartphone;
}[] = [
  { id: "virtual_provisioning", label: "Digital wallet", icon: Smartphone },
  { id: "network_dependent", label: "Card network", icon: Network },
  { id: "closed_loop", label: "Closed-loop", icon: Lock },
];

function parseAmount(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.round(n * 100) / 100, 99_999);
}

export function ScenarioSimulator() {
  const {
    cards,
    cardIds,
    defaultCardId,
    setDefaultCardId,
    businessCardId,
  } = useWallet();
  const [merchantId, setMerchantId] = useState("uber_eats");
  const [amountStr, setAmountStr] = useState("75");
  const [country, setCountry] = useState<TaxCountry>("CA");
  const [region, setRegion] = useState("ON");
  const [mode, setMode] = useState<RoutingMode>("virtual_provisioning");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("personal");

  const merchant = MERCHANT_PRESETS.find((m) => m.id === merchantId)!;
  const subtotal = parseAmount(amountStr);
  const tax = useMemo(
    () => (subtotal > 0 ? computeTax(subtotal, country, region) : null),
    [subtotal, country, region],
  );
  const chargeAmount = tax?.total ?? subtotal;

  const businessBlock = useMemo(() => {
    if (purchaseType !== "business") return null;
    if (!businessCardId) return "no-card" as const;
    if (!isBusinessMerchantAllowed(merchantId)) return "merchant" as const;
    return null;
  }, [purchaseType, businessCardId, merchantId]);

  const decision: RoutingDecision | null = useMemo(() => {
    if (cards.length < 1 || chargeAmount <= 0 || businessBlock) return null;
    const excluded = businessRoutingExclusions(
      cardIds,
      businessCardId,
      purchaseType,
    );
    try {
      return routeTransaction({
        mode,
        transaction: {
          amount: chargeAmount,
          merchantName: merchant.name,
          mcc: merchant.mcc,
        },
        portfolio: {
          cards,
          usage: [],
          preferences: {
            preferCashback: false,
            excludedCardIds: excluded,
          },
          defaultCardId:
            purchaseType === "business" && businessCardId
              ? businessCardId
              : defaultCardId && cards.some((c) => c.cardId === defaultCardId)
                ? defaultCardId
                : cards[0]?.cardId,
        },
      });
    } catch {
      return null;
    }
  }, [
    cards,
    cardIds,
    merchantId,
    chargeAmount,
    defaultCardId,
    businessCardId,
    purchaseType,
    businessBlock,
    mode,
    merchant,
  ]);

  function setCountryAndRegion(next: TaxCountry) {
    setCountry(next);
    setRegion(defaultRegion(next));
  }

  const regions = country === "CA" ? CA_PROVINCES : US_STATES;
  const sym = currencySymbol(country);

  return (
    <section id="simulator" className="oc-section bg-slate-50/80">
      <div className="oc-container">
        <header className="mb-8 text-center">
          <p className="oc-eyebrow inline-flex items-center justify-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            Rewards lab
          </p>
          <h2 className="oc-heading">Test a real purchase</h2>
          <p className="oc-lead mx-auto max-w-lg">
            Pick a merchant, set tax, and see which card in your{" "}
            <Link href="/wallet" className="oc-link">
              wallet
            </Link>{" "}
            wins.
          </p>
        </header>

        {cards.length === 0 ? (
          <div className="oc-panel mx-auto max-w-md text-center">
            <p className="text-sm text-brand-muted">
              Add cards in your{" "}
              <Link href="/wallet" className="oc-link">
                wallet
              </Link>{" "}
              to run purchase simulations.
            </p>
            <Link href="/wallet" className="oc-btn-primary mt-4 inline-flex">
              <Wallet className="h-4 w-4" aria-hidden />
              Open wallet
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="space-y-4 lg:col-span-2">
              <div className="oc-panel">
                <PurchaseControls
                  country={country}
                  region={region}
                  regions={regions}
                  amountStr={amountStr}
                  sym={sym}
                  tax={tax}
                  purchaseType={purchaseType}
                  businessCardId={businessCardId}
                  onCountry={setCountryAndRegion}
                  onRegion={setRegion}
                  onAmount={setAmountStr}
                  onPurchaseType={setPurchaseType}
                />
              </div>

              <div className="oc-panel">
                <MerchantPicker
                  merchantId={merchantId}
                  onSelect={setMerchantId}
                />
              </div>

              <div className="oc-panel space-y-4">
                {purchaseType === "personal" && (
                <div>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    <CreditCard className="h-3.5 w-3.5" aria-hidden />
                    Fallback card
                  </label>
                  <select
                    value={defaultCardId ?? cards[0]?.cardId}
                    onChange={(e) => setDefaultCardId(e.target.value)}
                    className="oc-input mt-2"
                  >
                    {cards.map((c) => (
                      <option key={c.cardId} value={c.cardId}>
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                )}
                <div>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    <Route className="h-3.5 w-3.5" aria-hidden />
                    Routing
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ROUTING_MODES.map((m) => {
                      const Icon = m.icon;
                      return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          mode === m.id
                            ? "bg-brand-ink text-white"
                            : "bg-slate-100 text-brand-body hover:bg-slate-200"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {m.label}
                      </button>
                    );})}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {businessBlock ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center sm:p-8"
                  >
                    <AlertCircle className="mx-auto h-10 w-10 text-amber-700" />
                    <h3 className="mt-3 text-lg font-bold text-brand-ink">
                      {businessBlock === "no-card"
                        ? "Set a business card first"
                        : "Not allowed on business card"}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
                      {businessBlock === "no-card" ? (
                        <>
                          Business purchases only route to your designated business
                          card.{" "}
                          <Link href="/wallet" className="font-semibold underline">
                            Choose one in your wallet
                          </Link>
                          .
                        </>
                      ) : (
                        <>
                          <strong>{merchant.name}</strong> is blocked for business
                          spending. Pick a work-appropriate merchant or switch to
                          personal.
                        </>
                      )}
                    </p>
                  </motion.div>
                ) : decision && tax ? (
                  <motion.div
                    key={`${decision.selectedCardId}-${merchantId}-${chargeAmount}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {purchaseType === "business" && (
                      <p className="flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-medium text-white">
                        <Briefcase className="h-4 w-4 shrink-0" />
                        Business purchase — only your business card can be charged
                      </p>
                    )}
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:px-5">
                      <MerchantLogo merchant={merchant} size={MERCHANT_LOGO.hero} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-ocean">
                          OneCard routes to
                        </p>
                        <p className="text-lg font-bold text-brand-ink">
                          {decision.selectedCardDisplayName}
                        </p>
                        <p className="text-sm text-brand-muted">
                          {decision.multiplier}× {decision.category.replace(/_/g, " ")} ·{" "}
                          {sym}
                          {tax.total.toFixed(2)} charged
                        </p>
                      </div>
                    </div>
                    <RewardsComparisonTable
                      decision={decision}
                      merchant={merchant}
                      cards={cards}
                      defaultCardId={defaultCardId ?? null}
                      sym={sym}
                      totalCharged={tax.total}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex min-h-[280px] items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-brand-muted"
                  >
                    <Calculator className="h-4 w-4 shrink-0" aria-hidden />
                    {subtotal <= 0
                      ? "Enter a purchase amount to simulate"
                      : "Adjust settings to simulate"}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PurchaseControls({
  country,
  region,
  regions,
  amountStr,
  sym,
  tax,
  purchaseType,
  businessCardId,
  onCountry,
  onRegion,
  onAmount,
  onPurchaseType,
}: {
  country: TaxCountry;
  region: string;
  regions: { code: string; label: string }[];
  amountStr: string;
  sym: string;
  tax: ReturnType<typeof computeTax> | null;
  purchaseType: PurchaseType;
  businessCardId: string | undefined;
  onCountry: (c: TaxCountry) => void;
  onRegion: (r: string) => void;
  onAmount: (v: string) => void;
  onPurchaseType: (t: PurchaseType) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
          <Receipt className="h-3.5 w-3.5" aria-hidden />
          Purchase type
        </p>
        <div className="mt-2 flex gap-2">
          {(["personal", "business"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onPurchaseType(t)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition ${
                purchaseType === t
                  ? "bg-brand-ink text-white"
                  : "bg-slate-100 text-brand-body hover:bg-slate-200"
              }`}
            >
              {t === "personal" ? (
                <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              {t === "personal" ? "Personal" : "Business"}
            </button>
          ))}
        </div>
        {purchaseType === "business" && !businessCardId && (
          <p className="mt-2 text-xs text-amber-800">
            <Link href="/wallet" className="font-semibold underline">
              Set a business card
            </Link>{" "}
            in your wallet to simulate.
          </p>
        )}
      </div>

      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          Location
        </p>
        <div className="mt-2 flex gap-2">
          {(["CA", "US"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCountry(c)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition ${
                country === c
                  ? "bg-brand-ink text-white"
                  : "bg-slate-100 text-brand-body hover:bg-slate-200"
              }`}
            >
              <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {c === "CA" ? "Canada" : "United States"}
            </button>
          ))}
        </div>
        <select
          value={region}
          onChange={(e) => onRegion(e.target.value)}
          className="oc-input mt-2"
          aria-label={country === "CA" ? "Province" : "State"}
        >
          {regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
          <DollarSign className="h-3.5 w-3.5" aria-hidden />
          Purchase amount
        </p>
        <div className="mt-2 flex items-baseline gap-1 border-b-2 border-brand-ink pb-1">
          <span className="text-3xl font-bold text-brand-ink">{sym}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => onAmount(e.target.value)}
            placeholder="0.00"
            className="min-w-0 flex-1 bg-transparent text-4xl font-bold tracking-tight text-brand-ink placeholder:text-slate-300 focus:outline-none sm:text-5xl"
            aria-label="Purchase amount before tax"
          />
        </div>

        {tax && tax.subtotal > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/80">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted">
              <Receipt className="h-3.5 w-3.5" aria-hidden />
              {country === "CA" ? "Canadian" : "US"} taxes · {tax.regionLabel}
            </p>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between text-brand-body">
                <dt>Subtotal</dt>
                <dd className="font-medium tabular-nums">
                  {sym}
                  {tax.subtotal.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between text-brand-body">
                <dt>
                  {tax.label} ({(tax.rate * 100).toFixed(2)}%)
                </dt>
                <dd className="font-medium tabular-nums">
                  {sym}
                  {tax.taxAmount.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-brand-ink">
                <dt>Total charged</dt>
                <dd className="tabular-nums">
                  {sym}
                  {tax.total.toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function MerchantPicker({
  merchantId,
  onSelect,
}: {
  merchantId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
        <Store className="h-3.5 w-3.5" aria-hidden />
        Merchant
      </p>
      <div className="mt-3 space-y-5">
        {MERCHANT_GROUPS.map((group) => {
          const items = merchantsInGroup(group);
          const sector = items.find((m) => m.kind === "sector");
          const brands = items.filter((m) => m.kind === "brand");
          const GroupIcon = MERCHANT_GROUP_STYLE[group].Icon;

          return (
            <div key={group}>
              <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                <GroupIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {group}
              </p>
              {sector && (
                <button
                  type="button"
                  onClick={() => onSelect(sector.id)}
                  className={`oc-sector-pill mt-2 w-full ${
                    merchantId === sector.id ? "oc-sector-pill--active" : ""
                  }`}
                >
                  <MerchantLogo merchant={sector} size={MERCHANT_LOGO.sector} />
                  <span>
                    <span className="block font-semibold text-brand-ink">
                      {sector.name}
                    </span>
                    <span className="text-xs text-brand-muted">
                      Sector · MCC {sector.mcc}
                    </span>
                  </span>
                </button>
              )}
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {brands.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelect(m.id)}
                    className={`oc-merchant-tile ${
                      merchantId === m.id ? "oc-merchant-tile--active" : ""
                    }`}
                    title={m.name}
                  >
                    <MerchantLogo merchant={m} size={MERCHANT_LOGO.tile} />
                    <span className="line-clamp-2 text-center text-[0.65rem] font-medium leading-tight text-brand-body">
                      {m.shortName ?? m.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
