"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Check,
  Maximize2,
  Route,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { useUserProfile } from "@/context/UserProfileContext";
import { useWallet } from "@/context/WalletContext";
import type { CardProduct, RewardCategory } from "@onecard/shared-types";

const EASE = [0.22, 1, 0.36, 1] as const;

const FEATURES = [
  "Link every card you already carry — no new accounts",
  "Tap once; merchant category routes to the best earn rate",
  "Rewards still post on your existing Amex, Visa, and more",
  "Tokenized routing — your numbers never touch our servers",
];

function shortCardName(displayName: string): string {
  return displayName
    .replace(/\s+Card$/i, "")
    .replace(/\s+(Visa|Mastercard|American Express).*$/i, "")
    .trim();
}

function issuerLabel(issuer: string): string {
  if (issuer.includes("American Express")) return "Amex";
  if (issuer.includes("Scotiabank")) return "Scotiabank";
  return issuer.split(/\s+/)[0] ?? issuer;
}

function issuerSummary(cards: CardProduct[]): string {
  const labels = [...new Set(cards.map((c) => issuerLabel(c.issuer)))];
  if (labels.length === 0) return "Add cards in your wallet";
  if (labels.length <= 4) return labels.join(" · ");
  return `${labels.slice(0, 4).join(" · ")} · +${labels.length - 4} more`;
}

function multiplierFor(card: CardProduct, category: RewardCategory): number {
  return (
    card.rewards.find((r) => r.category === category)?.multiplier ??
    card.rewards.find((r) => r.category === "other")?.multiplier ??
    1
  );
}

function rateLabel(category: RewardCategory, multiplier: number, currency: string): string {
  if (currency.toLowerCase().includes("cashback")) {
    return `${multiplier}% ${category.replace("_", " ")}`;
  }
  return `${multiplier}× ${category.replace("_", " ")}`;
}

function bestWalletCardFor(
  cards: CardProduct[],
  category: RewardCategory,
  preferNonAmex = false,
): CardProduct | undefined {
  if (cards.length === 0) return undefined;

  const ranked = [...cards].sort((a, b) => multiplierFor(b, category) - multiplierFor(a, category));
  if (!preferNonAmex) return ranked[0];

  const nonAmex = ranked.find((c) => !c.issuer.includes("American Express"));
  return nonAmex ?? ranked[0];
}

function buildActivity(cards: CardProduct[]) {
  const gasCard = bestWalletCardFor(cards, "gas", true);
  const groceryCard = bestWalletCardFor(cards, "groceries", true);
  const billsCard = bestWalletCardFor(cards, "recurring_bills", true);

  return [
    {
      date: "Today",
      merchant: "Shell",
      card: gasCard ? shortCardName(gasCard.displayName) : "Your best gas card",
      amount: "-$62.00",
      best: true,
    },
    {
      date: "Yesterday",
      merchant: "Loblaws",
      card: groceryCard ? shortCardName(groceryCard.displayName) : "Your best grocery card",
      amount: "-$118.40",
      best: false,
    },
    {
      date: "Mon",
      merchant: "Netflix",
      card: billsCard ? shortCardName(billsCard.displayName) : "Your best bills card",
      amount: "-$16.99",
      best: false,
    },
  ];
}

function buildFeaturedRouting(cards: CardProduct[]) {
  const winner = bestWalletCardFor(cards, "gas", true);
  const fallback: CardProduct = {
    cardId: "demo",
    issuer: "CIBC",
    displayName: "CIBC Dividend Visa Infinite",
    currency: "cashback %",
    rewards: [{ category: "gas", multiplier: 4, capMonthly: 80 }],
  };
  const card = winner ?? fallback;
  const mult = multiplierFor(card, "gas");

  return {
    merchant: "Shell",
    amount: "$62.00",
    mcc: "Gas · MCC 5542",
    card: shortCardName(card.displayName),
    rate: rateLabel("gas", mult, card.currency),
  };
}

function buildRoutingComparison(cards: CardProduct[]) {
  const winner = bestWalletCardFor(cards, "gas", true);
  const runnerUp = bestWalletCardFor(cards, "gas", false);
  const fallbackWinner = {
    name: "CIBC Dividend",
    rate: "4% gas",
    reward: "$2.48",
    win: true,
  };
  const fallbackRunner = {
    name: "Amex Cobalt",
    rate: "1× gas",
    reward: "$0.62",
    win: false,
  };

  if (!winner) return [fallbackWinner, fallbackRunner];

  const rows = [];
  if (winner) {
    rows.push({
      name: shortCardName(winner.displayName),
      rate: rateLabel("gas", multiplierFor(winner, "gas"), winner.currency),
      reward: "$2.48",
      win: true,
    });
  }
  const second =
    runnerUp && runnerUp.cardId !== winner?.cardId
      ? runnerUp
      : cards.find((c) => c.cardId !== winner?.cardId);
  if (second) {
    rows.push({
      name: shortCardName(second.displayName),
      rate: rateLabel("gas", multiplierFor(second, "gas"), second.currency),
      reward: "$0.62",
      win: false,
    });
  }
  return rows.length >= 2 ? rows : [fallbackWinner, fallbackRunner];
}

function usePointerTilt(disabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 140, damping: 22 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], disabled ? [0, 0] : [14, -14]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], disabled ? [0, 0] : [-16, 16]), spring);
  const glowX = useSpring(useTransform(mx, [-0.5, 0.5], [-24, 24]), spring);
  const glowY = useSpring(useTransform(my, [-0.5, 0.5], [-18, 18]), spring);

  const onMove = useCallback(
    (e: ReactMouseEvent) => {
      if (disabled) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    },
    [disabled, mx, my],
  );

  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return { ref, rotateX, rotateY, glowX, glowY, onMove, onLeave };
}

function OneCardVisual({ className = "" }: { className?: string }) {
  const { cardholderName } = useUserProfile();

  return (
    <div
      className={`relative aspect-[1.586] w-full overflow-hidden rounded-[1.15rem] shadow-[0_24px_64px_rgba(14,116,144,0.28)] ring-1 ring-white/20 ${className}`}
      style={{
        background: "linear-gradient(145deg, #1a1a1c 0%, #0a0a0b 42%, #18181b 100%)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-violet-500/10" />
      <div className="relative flex h-full flex-col justify-between p-5 text-white sm:p-6">
        <div className="flex items-start justify-between">
          <div className="h-6 w-9 rounded-md bg-gradient-to-br from-amber-200/95 to-amber-500/90 shadow-inner" />
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-white/40">
            OneCard
          </span>
        </div>
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white/45">
            Universal wallet
          </p>
          <p className="mt-1 text-lg font-semibold tracking-wide sm:text-xl">{cardholderName}</p>
        </div>
        <div className="flex items-end justify-between">
          <span className="font-mono text-[0.65rem] text-white/35">Tap · Route · Earn</span>
          <span className="flex gap-0.5">
            <span className="h-4 w-4 rounded-full bg-red-500/90" />
            <span className="-ml-2 h-4 w-4 rounded-full bg-amber-400/90" />
          </span>
        </div>
      </div>
    </div>
  );
}

function InteractiveOneCard() {
  const [compact, setCompact] = useState(false);
  const { ref, rotateX, rotateY, glowX, glowY, onMove, onLeave } = usePointerTilt(compact);
  const glowX2 = useTransform(glowX, (v) => -v * 0.6);
  const glowY2 = useTransform(glowY, (v) => -v * 0.5);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div
      ref={ref}
      className="relative flex h-full min-h-[240px] w-full items-center justify-center px-4 py-6"
      style={{ perspective: 1400 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <motion.div
        className="pointer-events-none absolute h-40 w-40 rounded-full bg-sky-400/25 blur-3xl"
        style={{ x: glowX, y: glowY }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute h-32 w-32 rounded-full bg-violet-400/15 blur-3xl"
        style={{ x: glowX2, y: glowY2 }}
        aria-hidden
      />

      <motion.div
        className="w-[min(100%,13.5rem)] sm:w-[15rem]"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <OneCardVisual />
        </motion.div>
      </motion.div>
    </div>
  );
}

function WalletMiniVisual() {
  return (
    <div className="relative mx-auto flex h-full min-h-[240px] w-full items-center justify-center px-6 py-8">
      <div
        className="relative w-[10.5rem]"
        style={{ perspective: 900 }}
      >
        {/* Stack edge — gives physical thickness without extra cards */}
        <div
          className="absolute inset-x-2 bottom-0 top-2 rounded-[1.05rem] bg-[#1a0f0a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-1 bottom-0 top-1 rounded-[1.05rem] bg-[#241610]"
          aria-hidden
        />

        {/* Leather wallet face */}
        <div className="phone-leather-wallet relative z-10 aspect-[1.35/1] w-full overflow-hidden rounded-[1.05rem] shadow-[0_18px_40px_rgba(42,24,16,0.35)]">
          <div className="absolute inset-x-0 top-0 h-[22%] phone-leather-lip rounded-t-[1.05rem]" aria-hidden />
          <div className="relative flex h-full flex-col items-center justify-center pt-[8%]">
            <Wallet className="h-11 w-11 text-amber-100/30" strokeWidth={1.35} />
          </div>
          {/* Stitch line along bottom fold */}
          <div
            className="pointer-events-none absolute inset-x-4 bottom-[18%] border-b border-dashed border-amber-100/15"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

function RoutingMiniVisual({ rows }: { rows: ReturnType<typeof buildRoutingComparison> }) {
  return (
    <div className="flex h-full min-h-[240px] w-full flex-col justify-center gap-3 px-5 py-6">
      {rows.map((row) => (
        <div
          key={row.name}
          className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs ${
            row.win ? "bg-emerald-50 ring-1 ring-emerald-200/80" : "bg-zinc-50 ring-1 ring-zinc-100"
          }`}
        >
          <div>
            <p className="font-semibold text-brand-ink">{row.name}</p>
            <p className="text-brand-muted">{row.rate}</p>
          </div>
          <p className={`font-bold tabular-nums ${row.win ? "text-emerald-700" : "text-brand-muted"}`}>
            {row.reward}
          </p>
        </div>
      ))}
      <p className="text-center text-[0.65rem] font-medium text-sky-600">Best card selected at tap</p>
    </div>
  );
}

function ShowcaseTile({
  title,
  children,
  onExpand,
  expandHref,
  featured = false,
}: {
  title: string;
  children: ReactNode;
  onExpand?: () => void;
  expandHref?: string;
  featured?: boolean;
}) {
  const expandClassName =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-white transition hover:bg-brand-charcoal";

  return (
    <article
      className={`group relative flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border bg-white sm:min-h-[26rem] ${
        featured
          ? "border-zinc-200 shadow-[0_8px_40px_rgba(14,116,144,0.08)]"
          : "border-zinc-200/90"
      }`}
    >
      <div className="flex items-start justify-between gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
        <h3 className="max-w-[14rem] text-lg font-semibold leading-snug tracking-tight text-brand-ink sm:text-xl">
          {title}
        </h3>
        {expandHref ? (
          <Link
            href={expandHref}
            className={expandClassName}
            aria-label={`Go to ${title.toLowerCase()}`}
          >
            <Maximize2 className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onExpand}
            className={expandClassName}
            aria-label={`Open ${title}`}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="relative mt-2 flex flex-1 flex-col">{children}</div>
    </article>
  );
}

function OneCardExpandModal({
  open,
  onClose,
  cards,
}: {
  open: boolean;
  onClose: () => void;
  cards: CardProduct[];
}) {
  const activity = buildActivity(cards);
  const featured = buildFeaturedRouting(cards);
  const linkedLabel = cards.length === 1 ? "1 linked" : `${cards.length} linked`;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="OneCard product overview"
        >
          <button
            type="button"
            className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close"
          />

          <motion.div
            className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4 sm:px-8 sm:py-5">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  OneCard
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl">
                  One card. Every reward program.
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-brand-ink hover:bg-zinc-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto">
              <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
                {/* Activity dashboard */}
                <div className="border-b border-zinc-100 bg-brand-surface/50 p-5 sm:p-8 lg:border-b-0 lg:border-r">
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                          Wallet
                        </p>
                        <p className="mt-0.5 text-lg font-semibold text-brand-ink">Your cards</p>
                      </div>
                      <Sparkles className="h-5 w-5 text-sky-500" />
                    </div>
                    <p className="mt-4 text-2xl font-bold tabular-nums text-brand-ink">{linkedLabel}</p>
                    <p className="text-sm text-brand-muted">{issuerSummary(cards)}</p>

                    <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                      Recent routing
                    </p>
                    <ul className="space-y-2">
                      {activity.map((row) => (
                        <li
                          key={`${row.date}-${row.merchant}`}
                          className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50/80 px-3 py-2.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-brand-ink">{row.merchant}</p>
                            <p className="truncate text-brand-muted">
                              {row.date} · {row.card}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-semibold tabular-nums text-brand-ink">{row.amount}</p>
                            {row.best && (
                              <span className="text-[0.6rem] font-bold uppercase text-emerald-600">
                                Best earn
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex justify-center lg:hidden">
                    <div className="w-[11rem]">
                      <OneCardVisual />
                    </div>
                  </div>
                </div>

                {/* Routing panel */}
                <div className="p-5 sm:p-8">
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                      At checkout
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-brand-ink">Smart routing</h3>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-brand-muted">Purchase</label>
                        <p className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-brand-ink">
                          {featured.merchant} · {featured.amount}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-brand-muted">Merchant category</label>
                        <p className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-brand-ink">
                          {featured.mcc}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-brand-muted">Routed to</label>
                        <p className="mt-1 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900">
                          <Route className="h-4 w-4 shrink-0" />
                          {featured.card} · {featured.rate}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-brand-muted hover:text-brand-ink"
                      >
                        Close
                      </button>
                      <Link
                        href="/how-it-works"
                        onClick={onClose}
                        className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-charcoal"
                      >
                        See how it works
                      </Link>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5">
                    {FEATURES.map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-sm text-brand-body">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                        {line}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/get-started"
                      onClick={onClose}
                      className="oc-btn-primary inline-flex min-h-[44px]"
                    >
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/simulator"
                      onClick={onClose}
                      className="oc-btn-secondary inline-flex min-h-[44px]"
                    >
                      Try simulator
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CardShowcaseSection() {
  const { cards } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const routingRows = buildRoutingComparison(cards);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <section className="oc-section border-t border-zinc-200 bg-brand-surface">
        <div className="oc-container-wide">
          <div className="max-w-2xl">
            <p className="oc-eyebrow">The card</p>
            <h2 className="oc-heading mt-3 text-3xl sm:text-4xl">
              One physical card. Every reward unlocked.
            </h2>
            <p className="oc-lead max-w-xl">
              Link your wallet once, carry OneCard, and let routing pick the best earn rate at
              every tap — same feel as a premium issuing programme, built for everyday spend.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:gap-5 lg:grid-cols-3">
            <ShowcaseTile
              title="Link the cards you already carry"
              expandHref="/wallet"
            >
              <WalletMiniVisual />
            </ShowcaseTile>

            <ShowcaseTile
              title="Tap once with OneCard everywhere"
              onExpand={openModal}
              featured
            >
              <InteractiveOneCard />
            </ShowcaseTile>

            <ShowcaseTile
              title="Earn more on every category"
              onExpand={openModal}
            >
              <RoutingMiniVisual rows={routingRows} />
            </ShowcaseTile>
          </div>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Hover the card to explore · tap{" "}
            <Maximize2 className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> to open the
            full product view
          </p>
        </div>
      </section>

      <OneCardExpandModal open={modalOpen} onClose={closeModal} cards={cards} />
    </>
  );
}
