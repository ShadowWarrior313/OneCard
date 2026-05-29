"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  Receipt,
  Wallet,
} from "lucide-react";
import { DemoWalletStrip } from "@/components/demo/DemoWalletStrip";
import { DemoTapButton } from "@/components/demo/DemoPhoneSlide";
import {
  DEMO_ROUTING_CARDS,
  DEMO_ROUTING_WINNER_INDEX,
  DEMO_SPEND_BY_CARD,
  DEMO_SPEND_RECENT,
  DEMO_SPEND_SELECT_INDEX,
  DEMO_WALLET_CARD_IDS,
  spendScrollOffset,
  routingFocusIndex,
  routingStatusMessage,
  routingWinnerBlend,
} from "@/components/demo/demoWalletData";

const EASE = [0.22, 1, 0.36, 1] as const;

const ROUTING_ROW_H = 44;
const ROUTING_VIEWPORT_H = 100;
const ROUTING_CENTER = (ROUTING_VIEWPORT_H - ROUTING_ROW_H) / 2;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function routingRowStyle(focused: boolean, winnerTint: number) {
  if (!focused) {
    return {
      backgroundColor: "rgb(250 250 249)",
      borderColor: "rgb(244 244 245)",
      opacity: 0.45,
    };
  }
  if (winnerTint > 0) {
    const t = winnerTint;
    return {
      backgroundColor: `rgb(${lerp(255, 236, t)} ${lerp(255, 253, t)} ${lerp(255, 245, t)})`,
      borderColor: `rgb(${lerp(186, 167, t)} ${lerp(230, 243, t)} ${lerp(253, 208, t)})`,
      opacity: 1,
    };
  }
  return {
    backgroundColor: "rgb(255 255 255)",
    borderColor: "rgb(186 230 253)",
    opacity: 1,
  };
}

export function AppRoutingView({
  progress = 0,
  merchant = "Loblaws",
  amount = "$118.40",
}: {
  progress?: number;
  merchant?: string;
  amount?: string;
}) {
  const focusIdx = routingFocusIndex(progress);
  const winnerBlend = routingWinnerBlend(progress);
  const status = routingStatusMessage(progress);
  const winnerCard = DEMO_ROUTING_CARDS[DEMO_ROUTING_WINNER_INDEX];
  const onWinnerSlot = focusIdx === DEMO_ROUTING_WINNER_INDEX;
  const scrolling = winnerBlend < 0.98;

  return (
    <div className="flex min-h-full flex-col pb-2">
      <p className="text-[0.5rem] font-semibold uppercase tracking-wider text-brand-muted">
        Routing
      </p>
      <div className="mt-1 flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-brand-ink">{merchant}</p>
        <p className="shrink-0 text-sm font-bold tabular-nums text-brand-ink">{amount}</p>
      </div>

      <motion.div
        className="mt-2 rounded-lg px-2.5 py-2"
        initial={false}
        animate={{
          backgroundColor:
            winnerBlend > 0.5
              ? `rgb(${lerp(240, 236, winnerBlend)} ${lerp(249, 253, winnerBlend)} ${lerp(255, 245, winnerBlend)})`
              : "rgb(240 249 255)",
          borderColor:
            winnerBlend > 0.5
              ? `rgb(${lerp(224, 167, winnerBlend)} ${lerp(242, 243, winnerBlend)} ${lerp(254, 208, winnerBlend)})`
              : "rgb(224 242 254)",
        }}
        style={{ borderWidth: 1, borderStyle: "solid" }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {status.kind === "comparing" && (
          <p className="text-[0.6rem] leading-snug text-brand-muted">{status.text}</p>
        )}
        {status.kind === "routing" && (
          <p className="text-[0.6rem] font-medium leading-snug text-brand-ink">{status.text}</p>
        )}
        {status.kind === "complete" && (
          <p className="flex items-center gap-1 text-[0.6rem] font-medium leading-snug text-emerald-700">
            <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            {status.text}
          </p>
        )}
      </motion.div>

      <p className="mt-2 text-[0.5rem] font-semibold uppercase tracking-wider text-brand-muted">
        Wallet analysis · {DEMO_ROUTING_CARDS.length} cards
      </p>

      <div
        className="relative mt-1.5 shrink-0 overflow-hidden"
        style={{ height: ROUTING_VIEWPORT_H }}
      >
        <motion.ul
          animate={{ y: -focusIdx * ROUTING_ROW_H + ROUTING_CENTER }}
          transition={{
            duration: scrolling ? 0.85 : 0.5,
            ease: scrolling ? [0.25, 0.1, 0.25, 1] : EASE,
          }}
          className="space-y-1"
        >
          {DEMO_ROUTING_CARDS.map((card, i) => {
            const focused = i === focusIdx;
            const winnerTint =
              focused && card.winner && onWinnerSlot ? winnerBlend : 0;
            const isWinnerRow = card.winner && focused && winnerTint >= 0.99;
            const rowStyle = routingRowStyle(focused, winnerTint);

            return (
              <motion.li
                key={card.name}
                style={{
                  height: ROUTING_ROW_H - 4,
                  borderWidth: 1,
                  borderStyle: "solid",
                }}
                className="flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5"
                initial={false}
                animate={rowStyle}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <motion.p
                      className="text-[0.58rem] font-semibold leading-tight"
                      initial={false}
                      animate={{
                        color: isWinnerRow
                          ? "rgb(6 78 59)"
                          : "rgb(15 23 42)",
                      }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      {card.name}
                    </motion.p>
                    {card.winner && focused && winnerTint > 0.82 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="shrink-0 rounded bg-brand-ink px-1 py-px text-[0.38rem] font-bold uppercase text-white"
                      >
                        Best
                      </motion.span>
                    )}
                  </div>
                  <p className="text-[0.48rem] leading-tight text-brand-muted">{card.rate}</p>
                </div>
                <motion.p
                  className="shrink-0 text-[0.58rem] font-bold tabular-nums"
                  initial={false}
                  animate={{
                    color: isWinnerRow ? "rgb(4 120 87)" : "rgb(100 116 139)",
                  }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {card.reward}
                </motion.p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      {onWinnerSlot && winnerBlend > 0.25 && (
        <motion.p
          initial={false}
          animate={{
            opacity: Math.min(1, (winnerBlend - 0.25) / 0.5),
            y: 0,
          }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[0.55rem] leading-relaxed text-emerald-900"
        >
          Charged to {winnerCard?.name} — rewards on your existing account.
        </motion.p>
      )}
    </div>
  );
}

const SPEND_CARD_ID = DEMO_WALLET_CARD_IDS[DEMO_SPEND_SELECT_INDEX];

export function SpendScene({ progress }: { progress: number }) {
  const selecting = progress > 0.2 && progress < 0.38;
  const cardTapped = progress >= 0.38;
  const scrollY = spendScrollOffset(progress);
  const scrolling = scrollY > 8;
  const activeIndex = selecting || cardTapped ? DEMO_SPEND_SELECT_INDEX : -1;
  const spend = DEMO_SPEND_BY_CARD[SPEND_CARD_ID];
  const rewardsTotal = DEMO_SPEND_RECENT.reduce(
    (sum, row) => sum + parseInt(row.reward.replace(/[^\d]/g, ""), 10),
    0,
  );

  return (
    <div className="flex min-h-full flex-col overflow-hidden pb-2">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-200/80 pb-1.5">
        <motion.span
          animate={{ scale: progress > 0.05 && progress < 0.12 ? 0.88 : 1 }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-brand-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </motion.span>
        <p className="text-xs font-semibold text-brand-ink">My Spend</p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <motion.div
          className="pb-4"
          animate={{ y: -scrollY }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <div className="flex justify-center overflow-visible pt-1">
            <DemoWalletStrip
              fullWidth
              expandActive
              activeIndex={activeIndex}
              showTapHint={(selecting || cardTapped) && !scrolling}
            />
          </div>

          <div className="mt-1 px-0.5">
            {!cardTapped ? (
              <p className="text-center text-[0.55rem] leading-relaxed text-brand-muted">
                {selecting ? "Selecting Amex Cobalt…" : "Tap a card to view spend"}
              </p>
            ) : (
              <>
                <motion.div
                  className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-zinc-100"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <p className="text-[0.5rem] font-semibold uppercase tracking-wider text-brand-muted">
                    This month
                  </p>
                  <p className="mt-0.5 text-[0.7rem] font-bold leading-tight text-brand-ink">
                    Amex Cobalt
                  </p>
                  <p className="mt-0.5 text-base font-bold tabular-nums leading-none text-brand-ink">
                    ${spend.total}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {spend.categories.map((row, i) => {
                      const rowP = Math.max(
                        0,
                        Math.min(1, (progress - 0.38 - i * 0.05) / 0.22),
                      );
                      return (
                        <li key={row.label}>
                          <div className="flex justify-between gap-2 text-[0.55rem]">
                            <span className="font-medium text-brand-ink">{row.label}</span>
                            <span className="shrink-0 tabular-nums text-brand-muted">
                              ${row.amount}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                            <motion.div
                              className={`h-full rounded-full ${
                                row.label === "Groceries" ? "bg-emerald-500" : "bg-sky-400"
                              }`}
                              initial={false}
                              animate={{ width: `${row.pct * rowP}%` }}
                              transition={{ duration: 0.35, ease: EASE }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>

                <div className="mt-3">
                  <p className="text-[0.5rem] font-semibold uppercase tracking-wider text-brand-muted">
                    Recent payments
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {DEMO_SPEND_RECENT.map((row, i) => {
                      const rowP = Math.max(
                        0,
                        Math.min(1, (progress - 0.5 - i * 0.06) / 0.18),
                      );
                      return (
                        <motion.li
                          key={row.merchant + row.date}
                          initial={false}
                          animate={{ opacity: rowP, y: (1 - rowP) * 6 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="flex items-start justify-between gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-zinc-100"
                        >
                          <div className="min-w-0">
                            <p className="text-[0.58rem] font-semibold text-brand-ink">
                              {row.merchant}
                            </p>
                            <p className="text-[0.48rem] text-brand-muted">
                              {row.date} · {row.category}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[0.58rem] font-bold tabular-nums text-brand-ink">
                              ${row.amount.toFixed(2)}
                            </p>
                            <p className="text-[0.48rem] font-medium text-emerald-600">
                              {row.reward}
                            </p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    opacity: Math.max(0, Math.min(1, (progress - 0.62) / 0.2)),
                    y: Math.max(0, (1 - Math.min(1, (progress - 0.62) / 0.2)) * 8),
                  }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="mt-3 rounded-lg bg-emerald-50 px-2.5 py-2.5 ring-1 ring-emerald-100"
                >
                  <p className="text-[0.5rem] font-semibold uppercase tracking-wider text-emerald-800/80">
                    Rewards collected
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums leading-none text-emerald-900">
                    {rewardsTotal.toLocaleString()} pts
                  </p>
                  <p className="mt-1 text-[0.52rem] leading-snug text-emerald-800">
                    Posted to your Amex Cobalt · Loblaws trip earned 5× groceries
                  </p>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const BILLS = [
  { card: "Amex Cobalt", due: "Jun 12", amount: "$412", status: "due" as const },
  { card: "RBC Ion Visa", due: "Jun 18", amount: "$186", status: "ok" as const },
  { card: "CIBC Dividend", due: "Paid", amount: "$94", status: "paid" as const },
] as const;

export function WalletHubScene({ progress }: { progress: number }) {
  const mySpendPressed = progress > 0.35 && progress < 0.55;
  const billsPressed = progress > 0.55;

  return (
    <div className="flex min-h-full flex-col pb-2">
      <div className="flex items-center gap-2 py-1">
        <Wallet className="h-4 w-4 text-brand-ink" />
        <p className="text-xs font-semibold text-brand-ink">Wallet</p>
      </div>
      <div className="mt-2 flex justify-center overflow-visible">
        <DemoWalletStrip fullWidth activeIndex={1} />
      </div>
      <div className="mt-4 space-y-2">
        <DemoTapButton pressed={mySpendPressed}>
          <div
            className={`flex min-h-[2.25rem] w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[0.65rem] font-semibold shadow-sm ${
              mySpendPressed
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-zinc-200 bg-white text-brand-ink"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            My Spend
          </div>
        </DemoTapButton>
        <DemoTapButton pressed={billsPressed}>
          <div
            className={`flex min-h-[2.25rem] w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[0.65rem] font-semibold shadow-sm ${
              billsPressed
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-zinc-200 bg-white text-brand-ink"
            }`}
          >
            <Receipt className="h-3.5 w-3.5 shrink-0" />
            Bill pay
          </div>
        </DemoTapButton>
      </div>
    </div>
  );
}

export function BillsScene({ progress }: { progress: number }) {
  const paying = progress > 0.55;
  const paid = progress > 0.82;

  return (
    <div className="flex min-h-full flex-col pb-2">
      <div className="flex items-center gap-1.5">
        <motion.span
          animate={{ scale: progress < 0.08 ? 0.88 : 1 }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-brand-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </motion.span>
        <p className="text-xs font-semibold text-brand-ink">Bill pay</p>
      </div>
      <p className="mt-0.5 text-[0.55rem] leading-relaxed text-brand-muted">
        All issuer statements in one place
      </p>

      <ul className="mt-3 space-y-1.5">
        {BILLS.map((bill) => {
          const isTarget = bill.card === "Amex Cobalt";
          const showPaid = isTarget && paid;
          const showPaying = isTarget && paying && !paid;

          return (
            <li
              key={bill.card}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 ring-1 ${
                showPaid
                  ? "bg-emerald-50 ring-emerald-200"
                  : showPaying
                    ? "bg-sky-50 ring-sky-200"
                    : "bg-white ring-zinc-100"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[0.62rem] font-semibold leading-tight text-brand-ink">
                  {bill.card}
                </p>
                <p className="text-[0.5rem] text-brand-muted">Due {bill.due}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[0.62rem] font-bold tabular-nums text-brand-ink">{bill.amount}</p>
                {showPaid ? (
                  <p className="text-[0.48rem] font-semibold text-emerald-700">Paid ✓</p>
                ) : showPaying ? (
                  <p className="text-[0.48rem] font-semibold text-sky-700">Processing…</p>
                ) : bill.status === "paid" ? (
                  <p className="text-[0.48rem] text-brand-muted">Paid</p>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[0.48rem] font-semibold text-sky-600">
                    Pay
                    <ChevronRight className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {paid && (
        <p className="mt-3 text-center text-[0.55rem] font-medium leading-relaxed text-emerald-700">
          Payment scheduled — no Amex app needed
        </p>
      )}
    </div>
  );
}
