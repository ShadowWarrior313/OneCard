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

const EASE = [0.22, 1, 0.36, 1] as const;

const FEATURES = [
  "Link every card you already carry — no new accounts",
  "Tap once; merchant category routes to the best earn rate",
  "Rewards still post on your existing Amex, Visa, and more",
  "Tokenized routing — your numbers never touch our servers",
];

const ACTIVITY = [
  { date: "Today", merchant: "Uber Eats", card: "Amex Cobalt", amount: "-$84.50", best: true },
  { date: "Yesterday", merchant: "Shell", card: "PC Financial", amount: "-$62.00", best: false },
  { date: "Mon", merchant: "Loblaws", card: "CIBC Dividend", amount: "-$118.40", best: false },
];

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
  const layers = [
    "from-emerald-800 to-emerald-950",
    "from-slate-800 to-slate-950",
    "from-blue-900 to-blue-950",
  ];

  return (
    <div className="relative mx-auto flex h-full min-h-[240px] w-full items-center justify-center px-6 py-8">
      {layers.map((gradient, i) => (
        <div
          key={gradient}
          className={`absolute aspect-[1.586] w-[9.5rem] rounded-xl bg-gradient-to-br ${gradient} shadow-lg ring-1 ring-white/10`}
          style={{
            transform: `translateY(${(2 - i) * 10}px) translateX(${(2 - i) * -6}px) rotate(${(2 - i) * -2.5}deg)`,
            zIndex: i + 1,
          }}
        />
      ))}
      <Wallet className="relative z-10 h-10 w-10 text-brand-ink/20" strokeWidth={1.25} />
    </div>
  );
}

function RoutingMiniVisual() {
  return (
    <div className="flex h-full min-h-[240px] w-full flex-col justify-center gap-3 px-5 py-6">
      {[
        { name: "Amex Cobalt", rate: "5× dining", reward: "$8.47", win: true },
        { name: "RBC Ion Visa", rate: "1× dining", reward: "$1.19", win: false },
      ].map((row) => (
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
  featured = false,
}: {
  title: string;
  children: ReactNode;
  onExpand: () => void;
  featured?: boolean;
}) {
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
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-white transition hover:bg-brand-charcoal"
          aria-label={`Open ${title}`}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
      <div className="relative mt-2 flex flex-1 flex-col">{children}</div>
    </article>
  );
}

function OneCardExpandModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
                    <p className="mt-4 text-2xl font-bold tabular-nums text-brand-ink">3 linked</p>
                    <p className="text-sm text-brand-muted">Amex · RBC · CIBC</p>

                    <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                      Recent routing
                    </p>
                    <ul className="space-y-2">
                      {ACTIVITY.map((row) => (
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
                          Uber Eats · $84.50
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-brand-muted">Merchant category</label>
                        <p className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-brand-ink">
                          Dining · MCC 5812
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-brand-muted">Routed to</label>
                        <p className="mt-1 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900">
                          <Route className="h-4 w-4 shrink-0" />
                          Amex Cobalt · 5× dining
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
  const [modalOpen, setModalOpen] = useState(false);

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
              onExpand={openModal}
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
              <RoutingMiniVisual />
            </ShowcaseTile>
          </div>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Hover the card to explore · tap{" "}
            <Maximize2 className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> to open the
            full product view
          </p>
        </div>
      </section>

      <OneCardExpandModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
