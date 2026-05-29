"use client";

import { routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RoutingDecision } from "@onecard/shared-types";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  CreditCard,
  Home,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useUserProfile } from "@/context/UserProfileContext";
import {
  CA_PROVINCES,
  OCCUPATION_LABELS,
  type Address,
  type Occupation,
  type PersonalDetails,
} from "@/lib/userProfile";
import { merchantById } from "@/data/merchants";
import { MerchantLogo } from "@/components/MerchantLogo";
import { IssuerLogo } from "@/components/IssuerLogo";
import { MERCHANT_LOGO } from "@/data/merchantIcons";
import { formatDecimal, formatMultiplier } from "@/lib/formatNumber";
import { OneCardLogo } from "@/components/OneCardLogo";
import { PhoneWalletFold } from "@/components/landing/PhoneWalletFold";
import { PhoneBillPayPanel } from "@/components/bills/PhoneBillPayPanel";
import { PhoneMySpendPanel } from "@/components/spend/PhoneMySpendPanel";

const PURCHASES = [
  { id: "uber_eats", amount: 54.9, when: "Today" },
  { id: "loblaws", amount: 84.2, when: "Yesterday" },
  { id: "air_canada", amount: 412.5, when: "Mon" },
  { id: "shell", amount: 68.0, when: "Sun" },
  { id: "netflix", amount: 18.99, when: "Sat" },
] as const;

const ACTIVITY: {
  id: string;
  title: string;
  sub: string;
  amount: number;
  positive: boolean;
  neutral?: boolean;
  screen?: "wallet";
}[] = [
  {
    id: "a1",
    title: "Dining run",
    sub: "3 purchases · routed automatically",
    amount: 12.4,
    positive: true,
  },
  {
    id: "a2",
    title: "Default card",
    sub: "CIBC Dividend · fallback set",
    amount: 0,
    positive: false,
    neutral: true,
    screen: "wallet",
  },
  {
    id: "a3",
    title: "Groceries",
    sub: "Loblaws · best card applied",
    amount: 6.8,
    positive: true,
  },
];

type PhoneTab = "home" | "wallet" | "you";
type PhoneScreen = PhoneTab | "activity" | "my-spend" | "bill-pay";

function routeForPurchase(
  merchantId: string,
  amount: number,
  cards: CardProduct[],
  defaultCardId: string | undefined,
): RoutingDecision | null {
  const merchant = merchantById(merchantId);
  if (!merchant || cards.length === 0) return null;
  try {
    return routeTransaction({
      mode: "virtual_provisioning",
      transaction: {
        amount,
        merchantName: merchant.name,
        mcc: merchant.mcc,
        merchantId: merchant.id,
        category: merchant.category,
      },
      portfolio: {
        cards,
        usage: [],
        preferences: { preferCashback: false, excludedCardIds: [] },
        defaultCardId:
          defaultCardId && cards.some((c) => c.cardId === defaultCardId)
            ? defaultCardId
            : cards[0]?.cardId,
      },
    });
  } catch {
    return null;
  }
}

function shortCardName(name: string): string {
  return name.replace(/American Express/g, "Amex").replace(/ Card$/, "");
}

/** Scrollable in-phone app demo — mobile + desktop. */
export function InteractivePhoneDemo() {
  const { cards, defaultCardId, setDefaultCardId, hasCard, toggleCard, businessCardId, setBusinessCardId } = useWallet();
  const { displayName, profile, personalDetails, updatePersonalDetails } = useUserProfile();
  const [screen, setScreen] = useState<PhoneScreen>("home");
  const [activeId, setActiveId] = useState<string>(PURCHASES[0].id);
  const [phase, setPhase] = useState<"idle" | "routing" | "done">("done");

  const tab: PhoneTab =
    screen === "activity"
      ? "home"
      : screen === "my-spend" || screen === "bill-pay"
        ? "wallet"
        : screen;

  const routed = useMemo(() => {
    const map = new Map<string, RoutingDecision | null>();
    for (const p of PURCHASES) {
      map.set(p.id, routeForPurchase(p.id, p.amount, cards, defaultCardId));
    }
    return map;
  }, [cards, defaultCardId]);

  const totalRewards = useMemo(() => {
    let sum = 0;
    for (const d of routed.values()) {
      if (d) sum += d.estimatedRewardValueCents / 100;
    }
    return sum;
  }, [routed]);

  const active = PURCHASES.find((p) => p.id === activeId) ?? PURCHASES[0];
  const merchant = merchantById(active.id);
  const decision = routed.get(active.id) ?? null;
  const selectedCard = cards.find((c) => c.cardId === decision?.selectedCardId);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function pickPurchase(merchantId: string) {
    setActiveId(merchantId);
    setPhase("routing");
    window.setTimeout(() => setPhase("done"), 450);
    if (screen === "activity") setScreen("home");
  }

  function goTo(tabTarget: PhoneTab) {
    setScreen(tabTarget);
  }

  function openScreen(next: PhoneScreen) {
    setScreen(next);
  }

  function openMySpend() {
    setScreen("my-spend");
  }

  function openBillPay() {
    setScreen("bill-pay");
  }

  return (
    <div className="mx-auto w-full max-w-[340px] touch-manipulation">
      <div className="rounded-[2rem] border border-zinc-300 bg-zinc-200 p-1.5 shadow-card sm:rounded-[2.25rem] sm:p-2">
        <div
          className="relative flex flex-col overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-[#f6f5f2] sm:rounded-[1.75rem]"
          style={{ height: "min(640px, calc(100dvh - 7rem))" }}
        >
          <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-2 text-[0.65rem] font-medium text-brand-muted sm:px-5 sm:pt-2.5">
            <span>9:41</span>
            <span className="h-4 w-14 rounded-full bg-zinc-900/10 sm:w-16" />
            <span className="w-8 text-right">●●●</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              data-phone-scroll
              className="min-h-0 flex-1 overflow-y-auto overflow-x-clip overscroll-y-contain px-3 pb-20 pt-2 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden"
            >
              {screen === "activity" && (
                <ScreenHeader title="Recent activity" onBack={() => goTo("home")} />
              )}
              {screen === "my-spend" && (
                <ScreenHeader title="My Spend" onBack={() => goTo("wallet")} />
              )}
              {screen === "bill-pay" && (
                <ScreenHeader title="Bill pay" onBack={() => goTo("wallet")} />
              )}
              {screen === "you" && (
                <h3 className="py-2 text-sm font-semibold text-brand-ink">Account</h3>
              )}

              {(screen === "home" || screen === "activity") && (
              <>
                {screen === "home" && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <OneCardLogo />
                      <span className="text-sm font-bold text-brand-ink">OneCard</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => goTo("you")}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-white"
                    >
                      {initials}
                    </button>
                  </div>
                )}

                {screen === "home" && (
                  <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
                      Rewards this month
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-emerald-700">
                      CA${formatDecimal(totalRewards, 2)}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#f6f5f2] px-3 py-2.5">
                        <p className="text-[0.6rem] font-medium uppercase tracking-wide text-brand-muted">
                          Cards linked
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-brand-ink">{cards.length}</p>
                      </div>
                      <div className="rounded-xl bg-[#f6f5f2] px-3 py-2.5">
                        <p className="text-[0.6rem] font-medium uppercase tracking-wide text-brand-muted">
                          Routed
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-brand-ink">
                          {PURCHASES.length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {screen === "home" && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
                        Linked cards
                      </p>
                      <button
                        type="button"
                        onClick={() => goTo("wallet")}
                        className="text-xs font-semibold text-brand-ink hover:underline"
                      >
                        Edit wallet
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {cards.map((card) => (
                        <button
                          key={card.cardId}
                          type="button"
                          onClick={() => goTo("wallet")}
                          className="flex w-[7.5rem] shrink-0 flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 text-left shadow-sm"
                        >
                          <IssuerLogo issuer={card.issuer} cardId={card.cardId} size={32} />
                          <p className="line-clamp-2 text-[0.65rem] font-semibold leading-tight text-brand-ink">
                            {shortCardName(card.displayName)}
                          </p>
                          {card.cardId === defaultCardId && (
                            <span className="text-[0.55rem] font-medium text-brand-muted">
                              Default
                            </span>
                          )}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => goTo("wallet")}
                        className="flex w-[7.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 bg-white/80 p-2.5 text-center"
                      >
                        <CreditCard className="h-5 w-5 text-brand-muted" />
                        <span className="text-[0.65rem] font-semibold text-brand-ink">
                          Add card
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <div className={screen === "home" ? "mt-6" : "mt-2"}>
                  {screen === "home" && (
                    <div className="flex items-center justify-between">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
                        Recent purchases
                      </p>
                      <span className="text-xs text-brand-muted">Tap to route</span>
                    </div>
                  )}
                  {screen === "activity" && (
                    <p className="mb-2 text-xs text-brand-muted">Tap a purchase to see routing</p>
                  )}
                  <div
                    className={
                      screen === "home"
                        ? "mt-2 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        : "space-y-2"
                    }
                  >
                    {PURCHASES.map(({ id, amount, when }) => {
                      const m = merchantById(id);
                      if (!m) return null;
                      const selected = id === activeId;
                      const earn = routed.get(id);
                      if (screen === "activity") {
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => pickPurchase(id)}
                            className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left"
                          >
                            <MerchantLogo merchant={m} size={MERCHANT_LOGO.tile} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-brand-ink">{m.name}</p>
                              <p className="text-xs text-brand-muted">
                                {when} · CA${amount.toFixed(2)}
                              </p>
                            </div>
                            {earn && (
                              <span className="text-sm font-bold text-emerald-700">
                                +CA${formatDecimal(earn.estimatedRewardValueCents / 100, 2)}
                              </span>
                            )}
                          </button>
                        );
                      }
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => pickPurchase(id)}
                          className={`flex w-[8.25rem] shrink-0 flex-col rounded-2xl border p-3 text-left transition ${
                            selected
                              ? "border-brand-ink bg-white shadow-sm"
                              : "border-zinc-200 bg-white hover:border-zinc-300"
                          }`}
                        >
                          <MerchantLogo merchant={m} size={MERCHANT_LOGO.tile} />
                          <p className="mt-2 truncate text-xs font-semibold text-brand-ink">
                            {m.shortName ?? m.name}
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-brand-ink">
                            CA${amount.toFixed(2)}
                          </p>
                          <p className="mt-1 text-[0.6rem] text-brand-muted">{when}</p>
                          {earn && (
                            <p className="mt-2 text-[0.6rem] font-medium text-emerald-700">
                              +CA${formatDecimal(earn.estimatedRewardValueCents / 100, 2)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {screen === "home" && (
                  <RoutingPanel
                    phase={phase}
                    decision={decision}
                    merchant={merchant}
                    selectedCard={selectedCard}
                    onAddCards={() => goTo("wallet")}
                  />
                )}

                <div className="mt-6">
                  {screen === "home" && (
                    <div className="flex items-center justify-between">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
                        Recent activity
                      </p>
                      <button
                        type="button"
                        onClick={() => openScreen("activity")}
                        className="text-xs font-semibold text-brand-ink hover:underline"
                      >
                        See all
                      </button>
                    </div>
                  )}
                  <ul className={`space-y-2 ${screen === "home" ? "mt-2" : ""}`}>
                    {(screen === "home" ? ACTIVITY.slice(0, 2) : ACTIVITY).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => item.screen && goTo(item.screen)}
                          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f5f2]">
                            {item.neutral ? (
                              <CreditCard className="h-4 w-4 text-brand-muted" />
                            ) : (
                              <Wallet className="h-4 w-4 text-brand-muted" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-ink">{item.title}</p>
                            <p className="truncate text-xs text-brand-muted">{item.sub}</p>
                          </div>
                          {!item.neutral && (
                            <span
                              className={`shrink-0 text-sm font-bold tabular-nums ${
                                item.positive ? "text-emerald-700" : "text-red-600"
                              }`}
                            >
                              {item.positive ? "+" : ""}CA${formatDecimal(item.amount, 2)}
                            </span>
                          )}
                          {item.neutral && (
                            <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {screen === "activity" && (
                  <RoutingPanel
                    phase={phase}
                    decision={decision}
                    merchant={merchant}
                    selectedCard={selectedCard}
                    onAddCards={() => goTo("wallet")}
                  />
                )}
              </>
              )}

              {screen === "wallet" && (
                <PhoneWalletFold
                  cards={cards}
                  defaultCardId={defaultCardId}
                  businessCardId={businessCardId}
                  hasCard={hasCard}
                  onSetDefault={setDefaultCardId}
                  onSetBusiness={setBusinessCardId}
                  onToggleCard={toggleCard}
                  onOpenMySpend={openMySpend}
                  onOpenBillPay={openBillPay}
                />
              )}

              {screen === "my-spend" && <PhoneMySpendPanel />}
              {screen === "bill-pay" && <PhoneBillPayPanel />}

              {screen === "you" && (
                <PhoneYouScreen
                  displayName={displayName}
                  email={profile?.email ?? "Demo account"}
                  initials={initials}
                  cards={cards}
                  businessCardId={businessCardId}
                  personalDetails={personalDetails}
                  onSetBusinessCard={setBusinessCardId}
                  onUpdateDetails={updatePersonalDetails}
                  onGoToWallet={() => goTo("wallet")}
                />
              )}
            </div>

          </div>

          <nav className="absolute inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white px-1 pb-3 pt-2 sm:px-2">
            <ul className="grid grid-cols-3 gap-1 text-center">
              {(
                [
                  { id: "home" as const, label: "Home", icon: Home },
                  { id: "wallet" as const, label: "Wallet", icon: Wallet },
                  { id: "you" as const, label: "You", icon: User },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => goTo(id)}
                    className={`flex min-h-[44px] w-full flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[0.6rem] font-semibold active:scale-[0.98] ${
                      tab === id ? "text-brand-ink" : "text-brand-muted hover:text-brand-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={tab === id ? 2.25 : 1.75} />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-brand-muted px-2">
        Scroll inside the phone · tap tabs and cards to explore
      </p>
    </div>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <button
        type="button"
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-200/80"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4 text-brand-ink" />
      </button>
      <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
    </div>
  );
}

function PhoneField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink/20"
      />
    </label>
  );
}

function PhoneAddressFields({
  title,
  address,
  onChange,
}: {
  title: string;
  address: Address;
  onChange: (patch: Partial<Address>) => void;
}) {
  return (
    <div className="space-y-2">
      {title ? (
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
          {title}
        </p>
      ) : null}
      <PhoneField
        label="Street"
        value={address.line1}
        onChange={(line1) => onChange({ line1 })}
        placeholder="123 Main St"
      />
      <PhoneField
        label="Unit / Apt"
        value={address.line2}
        onChange={(line2) => onChange({ line2 })}
        placeholder="Unit 4B"
      />
      <div className="grid grid-cols-2 gap-2">
        <PhoneField
          label="City"
          value={address.city}
          onChange={(city) => onChange({ city })}
          placeholder="Toronto"
        />
        <label className="block">
          <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-brand-muted">
            Province
          </span>
          <select
            value={address.province}
            onChange={(e) => onChange({ province: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs text-brand-ink focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink/20"
          >
            <option value="">—</option>
            {CA_PROVINCES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>
      <PhoneField
        label="Postal code"
        value={address.postalCode}
        onChange={(postalCode) => onChange({ postalCode })}
        placeholder="M5V 2T6"
      />
    </div>
  );
}

function formatAddressLine(address: Address): string {
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.province].filter(Boolean).join(", "),
    address.postalCode,
  ].filter(Boolean);
  return parts.join(" · ");
}

function PhoneYouScreen({
  displayName,
  email,
  initials,
  cards,
  businessCardId,
  personalDetails,
  onSetBusinessCard,
  onUpdateDetails,
  onGoToWallet,
}: {
  displayName: string;
  email: string;
  initials: string;
  cards: CardProduct[];
  businessCardId: string | undefined;
  personalDetails: PersonalDetails;
  onSetBusinessCard: (id: string | undefined) => void;
  onUpdateDetails: (patch: Partial<PersonalDetails>) => void;
  onGoToWallet: () => void;
}) {
  const businessCard = cards.find((c) => c.cardId === businessCardId);
  const occupations = Object.entries(OCCUPATION_LABELS) as [Occupation, string][];

  function updateHome(patch: Partial<Address>) {
    onUpdateDetails({
      homeAddress: { ...personalDetails.homeAddress, ...patch },
    });
  }

  function updateBilling(patch: Partial<Address>) {
    onUpdateDetails({
      billingAddress: { ...personalDetails.billingAddress, ...patch },
    });
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-ink text-sm font-bold text-white">
            {initials}
          </span>
          <div>
            <p className="font-semibold text-brand-ink">{displayName}</p>
            <p className="text-sm text-brand-muted">{email}</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-3.5">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-brand-muted" />
          <h4 className="text-sm font-semibold text-brand-ink">Business card</h4>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
          Link one card for work expenses. Business purchases route only to this card.
        </p>
        {cards.length === 0 ? (
          <button
            type="button"
            onClick={onGoToWallet}
            className="mt-3 w-full rounded-xl border border-dashed border-zinc-300 py-2.5 text-xs font-semibold text-brand-ink hover:bg-[#f6f5f2]"
          >
            Add cards to link a business card
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <label className="block">
              <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-brand-muted">
                Designated card
              </span>
              <select
                value={businessCardId ?? ""}
                onChange={(e) =>
                  onSetBusinessCard(e.target.value ? e.target.value : undefined)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-brand-ink focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink/20"
              >
                <option value="">None linked</option>
                {cards.map((card) => (
                  <option key={card.cardId} value={card.cardId}>
                    {shortCardName(card.displayName)}
                  </option>
                ))}
              </select>
            </label>
            {businessCard && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                <IssuerLogo issuer={businessCard.issuer} cardId={businessCard.cardId} size={28} />
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-emerald-900">
                  {shortCardName(businessCard.displayName)} linked for business
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-3.5">
        <h4 className="text-sm font-semibold text-brand-ink">Personal details</h4>
        <label className="mt-3 block">
          <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-brand-muted">
            Occupation
          </span>
          <select
            value={personalDetails.occupation}
            onChange={(e) =>
              onUpdateDetails({ occupation: e.target.value as Occupation | "" })
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-brand-ink focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink/20"
          >
            <option value="">Select occupation</option>
            {occupations.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {occupations.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdateDetails({ occupation: value })}
              className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold transition ${
                personalDetails.occupation === value
                  ? "bg-brand-ink text-white"
                  : "bg-[#f6f5f2] text-brand-muted hover:text-brand-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-3.5">
        <PhoneAddressFields title="Home address" address={personalDetails.homeAddress} onChange={updateHome} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
            Billing address
          </p>
          <label className="flex items-center gap-1.5 text-[0.65rem] font-medium text-brand-muted">
            <input
              type="checkbox"
              checked={personalDetails.billingSameAsHome}
              onChange={(e) => onUpdateDetails({ billingSameAsHome: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-brand-ink focus:ring-brand-ink/30"
            />
            Same as home
          </label>
        </div>
        {personalDetails.billingSameAsHome ? (
          <p className="mt-2 text-xs text-brand-muted">
            {formatAddressLine(personalDetails.homeAddress) || "Uses your home address when set."}
          </p>
        ) : (
          <div className="mt-3">
            <PhoneAddressFields
              title=""
              address={personalDetails.billingAddress}
              onChange={updateBilling}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function RoutingPanel({
  phase,
  decision,
  merchant,
  selectedCard,
  onAddCards,
}: {
  phase: "idle" | "routing" | "done";
  decision: RoutingDecision | null;
  merchant: ReturnType<typeof merchantById>;
  selectedCard: CardProduct | undefined;
  onAddCards: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm">
      {phase === "routing" ? (
        <div className="flex items-center gap-2.5 py-1">
          <Sparkles className="h-4 w-4 animate-pulse text-brand-muted" />
          <p className="text-sm font-medium text-brand-body">Routing purchase…</p>
        </div>
      ) : decision && merchant ? (
        <>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
            OneCard routes to
          </p>
          <div className="mt-2 flex items-center gap-3">
            {selectedCard && (
              <IssuerLogo
                issuer={selectedCard.issuer}
                cardId={selectedCard.cardId}
                size={36}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-ink">
                {decision.selectedCardDisplayName}
              </p>
              <p className="text-xs text-brand-muted">
                {formatMultiplier(decision.multiplier)}{" "}
                {decision.category.replace(/_/g, " ")} · earn CA$
                {formatDecimal(decision.estimatedRewardValueCents / 100, 2)}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-muted" />
          </div>
        </>
      ) : (
        <p className="text-sm text-brand-muted">
          <button
            type="button"
            onClick={onAddCards}
            className="font-semibold text-brand-ink underline"
          >
            Add cards
          </button>{" "}
          to see routing.
        </p>
      )}
    </div>
  );
}
