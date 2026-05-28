"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Maximize2, RotateCw, Wallet } from "lucide-react";
import { FlippableOneCard } from "@/components/landing/FlippableOneCard";
import { TapOnceExpandModal } from "@/components/landing/TapOnceExpandModal";
import { WalletLinkExpandModal } from "@/components/landing/WalletLinkExpandModal";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { useWallet } from "@/context/WalletContext";
import { merchantById } from "@/data/merchants";
import {
  buildRoutingRowsForScenario,
  formatCad,
  TAP_DEMO_SCENARIOS,
  type RoutingRow,
} from "@/lib/tapDemoScenarios";
import type { CardProduct } from "@onecard/shared-types";

const EASE = [0.22, 1, 0.36, 1] as const;
const SHOWCASE_SCENARIO = TAP_DEMO_SCENARIOS[0]!;

function buildRoutingComparison(cards: CardProduct[]): RoutingRow[] {
  return buildRoutingRowsForScenario(cards, SHOWCASE_SCENARIO).rows;
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

function FloatingRouteChips({
  rows,
  active,
  merchantName,
  amountLabel,
}: {
  rows: RoutingRow[];
  active: boolean;
  merchantName: string;
  amountLabel: string;
}) {
  const winner = rows.find((r) => r.win) ?? rows[0];
  const merchant = merchantById(SHOWCASE_SCENARIO.merchantId);

  return (
    <>
      <motion.div
        className="pointer-events-none absolute left-3 top-12 z-0 max-w-[7.5rem] rounded-xl border border-white/70 bg-white/90 px-2.5 py-2 shadow-md backdrop-blur-sm sm:left-4 sm:top-14"
        initial={false}
        animate={{ opacity: active ? 1 : 0.55, y: active ? 0 : 6, scale: active ? 1 : 0.96 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <p className="text-[0.6rem] font-medium text-brand-muted">Merchant</p>
        <p className="text-xs font-semibold text-brand-ink">
          {merchantName}
          {merchant ? ` · ${merchant.group}` : ""}
        </p>
        <p className="mt-0.5 text-[0.6rem] tabular-nums text-brand-muted">{amountLabel}</p>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute right-2 top-[4.5rem] z-0 flex max-w-[8.5rem] items-center gap-1 rounded-xl border border-white/70 bg-white/90 px-2 py-1.5 shadow-md backdrop-blur-sm sm:right-3"
        initial={false}
        animate={{ opacity: active ? 1 : 0.5, x: active ? 0 : 8 }}
        transition={{ duration: 0.35, ease: EASE, delay: 0.04 }}
      >
        <ArrowRight className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
        <p className="truncate text-[0.65rem] font-semibold text-brand-ink">
          {winner?.name ?? "Best card"}
        </p>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute bottom-16 left-4 z-0 rounded-xl border border-emerald-200/80 bg-emerald-50/95 px-2.5 py-1.5 shadow-sm sm:bottom-[4.5rem]"
        initial={false}
        animate={{ opacity: active ? 1 : 0.45, y: active ? 0 : 8 }}
        transition={{ duration: 0.35, ease: EASE, delay: 0.08 }}
      >
        <p className="text-[0.65rem] font-semibold text-emerald-800">
          {winner?.reward ?? "$0.00"} · {winner?.rate ?? "Best rate"}
        </p>
      </motion.div>
    </>
  );
}

function InteractiveOneCard({
  routingRows,
  merchantName,
  amountLabel,
}: {
  routingRows: RoutingRow[];
  merchantName: string;
  amountLabel: string;
}) {
  const [compact, setCompact] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
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
      className="relative mx-3 mb-3 mt-1 flex min-h-[16.5rem] flex-1 flex-col overflow-hidden rounded-xl sm:mx-4 sm:mb-4 sm:min-h-[18rem] sm:rounded-2xl"
      style={{
        background:
          "radial-gradient(ellipse 90% 70% at 20% 10%, rgba(196,181,253,0.55), transparent 55%), radial-gradient(ellipse 80% 60% at 90% 90%, rgba(253,186,140,0.45), transparent 50%), linear-gradient(160deg, #f5f3ff 0%, #eff6ff 45%, #fff7ed 100%)",
      }}
    >
      <div
        ref={ref}
        className="relative flex flex-1 flex-col items-center justify-center px-4 py-4 pb-3"
        style={{ perspective: 1400 }}
        onMouseMove={onMove}
        onMouseLeave={() => {
          onLeave();
          setHovered(false);
        }}
        onMouseEnter={() => setHovered(true)}
      >
        <FloatingRouteChips
          rows={routingRows}
          active={hovered || compact}
          merchantName={merchantName}
          amountLabel={amountLabel}
        />

        <motion.div
          className="pointer-events-none absolute h-40 w-40 rounded-full bg-sky-400/20 blur-3xl"
          style={{ x: glowX, y: glowY }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute h-32 w-32 rounded-full bg-violet-400/15 blur-3xl"
          style={{ x: glowX2, y: glowY2 }}
          aria-hidden
        />

        <motion.div
          className="relative z-10 w-[min(100%,13.75rem)] sm:w-[15.25rem]"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <FlippableOneCard flipped={flipped} />
          </motion.div>
        </motion.div>

        <button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          className="relative z-10 mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3.5 py-2 text-xs font-semibold text-brand-ink shadow-sm transition hover:border-sky-200 hover:bg-white"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden />
          {flipped ? "Show front" : "Rotate card"}
        </button>
      </div>
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
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-white transition-colors duration-200 group-hover:bg-orange-500 group-hover:hover:bg-orange-600";

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

export function CardShowcaseSection() {
  const { cards } = useWallet();
  const [tapModalOpen, setTapModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const routingRows = buildRoutingComparison(cards);
  const showcaseMeta = buildRoutingRowsForScenario(cards, SHOWCASE_SCENARIO);
  const amountLabel = formatCad(SHOWCASE_SCENARIO.amount);

  const openTapModal = useCallback(() => setTapModalOpen(true), []);
  const closeTapModal = useCallback(() => setTapModalOpen(false), []);
  const openWalletModal = useCallback(() => setWalletModalOpen(true), []);
  const closeWalletModal = useCallback(() => setWalletModalOpen(false), []);

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
              onExpand={openWalletModal}
            >
              <WalletMiniVisual />
            </ShowcaseTile>

            <ShowcaseTile
              title="Tap once with OneCard everywhere"
              onExpand={openTapModal}
              featured
            >
              <InteractiveOneCard
                routingRows={routingRows}
                merchantName={showcaseMeta.merchantName}
                amountLabel={amountLabel}
              />
            </ShowcaseTile>

            <ShowcaseTile
              title="Earn more on every category"
              expandHref="/simulator"
            >
              <RoutingMiniVisual rows={routingRows} />
            </ShowcaseTile>
          </div>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Tap{" "}
            <Maximize2 className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> on Link cards or Tap once
            to expand · use <strong className="font-medium text-brand-body">Rotate card</strong> on the
            middle tile to flip
          </p>
        </div>
      </section>

      <WalletLinkExpandModal open={walletModalOpen} onClose={closeWalletModal} />
      <TapOnceExpandModal open={tapModalOpen} onClose={closeTapModal} />
    </>
  );
}
