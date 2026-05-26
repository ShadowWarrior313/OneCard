"use client";

import { routeTransaction } from "@onecard/rewards-engine";
import type { RoutingDecision } from "@onecard/shared-types";
import type { CardProduct } from "@onecard/shared-types";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  MERCHANT_GROUPS,
  MERCHANT_PRESETS,
  featuredBrandsInGroup,
  merchantAvailableAt,
  merchantById,
  merchantsInGroup,
  searchMerchantsInGroup,
  type MerchantGroup,
  type MerchantLocation,
  type MerchantPreset,
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
import { MerchantGroupSearch } from "@/components/MerchantGroupSearch";
import { SimulatorResultsPanel } from "@/components/SimulatorResultsPanel";
import { MERCHANT_LOGO, MERCHANT_GROUP_STYLE } from "@/data/merchantIcons";
import {
  businessRoutingExclusions,
  isBusinessMerchantAllowed,
  type PurchaseType,
} from "@/lib/businessSpend";
import Link from "next/link";
import {
  Briefcase,
  CreditCard,
  DollarSign,
  FlaskConical,
  Globe,
  MapPin,
  Receipt,
  Store,
  User,
  Wallet,
} from "lucide-react";

const ROUTING_MODE = "virtual_provisioning" as const;

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
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("personal");

  const merchant = MERCHANT_PRESETS.find((m) => m.id === merchantId)!;
  const merchantLocation: MerchantLocation = useMemo(
    () => ({ country, region }),
    [country, region],
  );

  useEffect(() => {
    setMerchantId((prev) => {
      const current = merchantById(prev);
      if (current && merchantAvailableAt(current, merchantLocation)) {
        return prev;
      }

      const group = current?.group ?? "Food & drink";
      const replacement =
        featuredBrandsInGroup(group, merchantLocation)[0] ??
        merchantsInGroup(group).find((m) => m.kind === "sector");
      return replacement?.id ?? prev;
    });
  }, [merchantLocation]);
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
        mode: ROUTING_MODE,
        transaction: {
          amount: chargeAmount,
          merchantName: merchant.name,
          mcc: merchant.mcc,
          merchantId: merchant.id,
          category: merchant.category,
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
    merchant,
  ]);

  function setCountryAndRegion(next: TaxCountry) {
    setCountry(next);
    setRegion(defaultRegion(next));
  }

  const regions = country === "CA" ? CA_PROVINCES : US_STATES;
  const sym = currencySymbol(country);

  return (
    <section id="simulator" className="oc-section bg-brand-surface">
      <div className="oc-container-wide">
        <header className="mb-8 max-w-2xl">
          <p className="oc-eyebrow inline-flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            Rewards simulator
          </p>
          <h2 className="oc-heading mt-2">Test a real purchase</h2>
          <p className="oc-lead max-w-lg">
            Pick a merchant, set tax, and see which card in your{" "}
            <Link href="/wallet" className="oc-link">
              wallet
            </Link>{" "}
            wins.
          </p>
        </header>

        {cards.length === 0 ? (
          <div className="oc-simulator-shell mx-auto max-w-md text-center">
            <p className="text-sm text-brand-muted">
              Add cards in your{" "}
              <Link href="/wallet" className="oc-link">
                wallet
              </Link>{" "}
              to run purchase simulations.
            </p>
            <Link href="/wallet" className="oc-btn-primary-dark mt-4 inline-flex !text-brand-ink">
              <Wallet className="h-4 w-4" aria-hidden />
              Open wallet
            </Link>
          </div>
        ) : (
          <div className="oc-simulator-shell space-y-4 sm:space-y-6">
            {/* Results first on mobile */}
            <div className="min-w-0 max-w-full lg:hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${merchantId}-${chargeAmount}-${purchaseType}-mobile`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <SimulatorResultsPanel
                    merchant={merchant}
                    sym={sym}
                    taxTotal={tax?.total ?? null}
                    chargeAmount={chargeAmount}
                    cards={cards}
                    decision={decision}
                    businessBlock={businessBlock}
                    purchaseType={purchaseType}
                    defaultCardId={defaultCardId ?? null}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

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

            <div className="grid min-w-0 gap-4 lg:grid-cols-12 lg:gap-6">
              <div className="min-w-0 space-y-4 lg:col-span-7">
                <div className="oc-panel">
                  <MerchantPicker
                    merchantId={merchantId}
                    location={merchantLocation}
                    onSelect={setMerchantId}
                  />
                </div>

                {purchaseType === "personal" && (
                  <div className="oc-panel">
                    <FallbackCardControl
                      cards={cards}
                      defaultCardId={defaultCardId}
                      onDefaultCard={setDefaultCardId}
                    />
                  </div>
                )}
              </div>

              <div className="hidden lg:col-span-5 lg:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${merchantId}-${chargeAmount}-${purchaseType}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <SimulatorResultsPanel
                      merchant={merchant}
                      sym={sym}
                      taxTotal={tax?.total ?? null}
                      chargeAmount={chargeAmount}
                      cards={cards}
                      decision={decision}
                      businessBlock={businessBlock}
                      purchaseType={purchaseType}
                      defaultCardId={defaultCardId ?? null}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
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
                  : "border border-zinc-200 bg-white text-brand-body hover:bg-zinc-50"
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
                  : "border border-zinc-200 bg-white text-brand-body hover:bg-zinc-50"
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
          <div className="mt-4 oc-panel-inset">
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
              <div className="flex justify-between border-t border-brand-purple/10 pt-2 font-semibold text-brand-ink">
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

function FallbackCardControl({
  cards,
  defaultCardId,
  onDefaultCard,
}: {
  cards: CardProduct[];
  defaultCardId: string | undefined;
  onDefaultCard: (id: string) => void;
}) {
  return (
    <div>
      <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
        <CreditCard className="h-3.5 w-3.5" aria-hidden />
        Fallback card
      </label>
      <select
        value={defaultCardId ?? cards[0]?.cardId}
        onChange={(e) => onDefaultCard(e.target.value)}
        className="oc-input mt-2"
      >
        {cards.map((c) => (
          <option key={c.cardId} value={c.cardId}>
            {c.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

function MerchantPicker({
  merchantId,
  location,
  onSelect,
}: {
  merchantId: string;
  location: MerchantLocation;
  onSelect: (id: string) => void;
}) {
  const current = merchantById(merchantId);
  const [activeGroup, setActiveGroup] = useState<MerchantGroup>(
    current?.group ?? "Food & drink",
  );
  const [queries, setQueries] = useState<Partial<Record<MerchantGroup, string>>>(
    {},
  );

  useEffect(() => {
    if (current?.group) setActiveGroup(current.group);
  }, [current?.group]);

  function setGroupQuery(group: MerchantGroup, query: string) {
    setQueries((prev) => ({ ...prev, [group]: query }));
  }

  const group = activeGroup;
  const items = merchantsInGroup(group);
  const sector = items.find((m) => m.kind === "sector");
  const query = queries[group] ?? "";
  const trimmed = query.trim();
  const brands = trimmed
    ? searchMerchantsInGroup(group, query, location)
    : featuredBrandsInGroup(group, location, 12);
  const GroupIcon = MERCHANT_GROUP_STYLE[group].Icon;

  return (
    <div className="min-w-0 max-w-full">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
        <Store className="h-3.5 w-3.5" aria-hidden />
        Merchant
      </p>

      <div className="mt-3 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MERCHANT_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActiveGroup(g)}
            className={`oc-simulator-tab ${
              activeGroup === g ? "oc-simulator-tab--active" : "oc-simulator-tab--idle"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-brand-purple/80">
          <GroupIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {group}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {sector && (
            <button
              type="button"
              onClick={() => onSelect(sector.id)}
              className={`oc-sector-pill w-full ${
                merchantId === sector.id ? "oc-sector-pill--active" : ""
              }`}
            >
              <MerchantLogo merchant={sector} size={MERCHANT_LOGO.sector} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-brand-ink">
                  {sector.name}
                </span>
                <span className="text-xs text-brand-muted">
                  Sector · MCC {sector.mcc}
                </span>
              </span>
            </button>
          )}
          <MerchantGroupSearch
            group={group}
            query={query}
            onQueryChange={(next) => setGroupQuery(group, next)}
          />
        </div>
        {trimmed && brands.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-brand-purple/20 bg-brand-purple-soft/20 px-3 py-2.5 text-sm text-brand-muted">
            No merchants match &ldquo;{trimmed}&rdquo; in {group.toLowerCase()}.
          </p>
        ) : brands.length > 0 ? (
          <MerchantBrandGrid
            brands={brands}
            merchantId={merchantId}
            onSelect={onSelect}
          />
        ) : null}
      </div>
    </div>
  );
}

function MerchantBrandGrid({
  brands,
  merchantId,
  onSelect,
}: {
  brands: MerchantPreset[];
  merchantId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-3 grid min-w-0 max-w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
  );
}
