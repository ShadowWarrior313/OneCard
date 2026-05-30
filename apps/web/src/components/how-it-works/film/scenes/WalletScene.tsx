"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

/**
 * Scene 4 — Wallet management + bills. A clean linked-cards view (the user adds
 * a card) beside a Bill Pay panel where recurring bills route to the optimal card.
 */

const WALLET_CARDS = [
  { name: "Amex Cobalt", meta: "Amex · MR points" },
  { name: "CIBC Dividend", meta: "Visa · Cashback" },
  { name: "RBC Ion", meta: "Visa · Avion" },
];

const BILLS = [
  { name: "Hydro One", amount: "$94.20", route: "CIBC Dividend", tone: "3% utilities" },
  { name: "Internet", amount: "$85.00", route: "Amex Cobalt", tone: "2× recurring" },
  { name: "Phone plan", amount: "$60.00", route: "Amex Cobalt", tone: "2× recurring" },
];

function WalletRow({ timeMs, name, meta, index }: { timeMs: MotionValue<number>; name: string; meta: string; index: number }) {
  const inAt = 31300 + index * 200;
  const o = useTransform(timeMs, [inAt, inAt + 360], [0, 1], { clamp: true });
  const x = useTransform(timeMs, [inAt, inAt + 360], [-16, 0], { clamp: true });
  return (
    <motion.div style={{ opacity: o, x }} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-zinc-200">
      <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-zinc-800 to-zinc-950">
        <span className="h-2.5 w-3.5 rounded-[2px] bg-gradient-to-br from-amber-200 to-amber-500" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold text-zinc-900">{name}</p>
        <p className="truncate text-[11px] text-zinc-400">{meta}</p>
      </div>
      <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
    </motion.div>
  );
}

function BillRow({ timeMs, bill, index }: { timeMs: MotionValue<number>; bill: (typeof BILLS)[number]; index: number }) {
  const inAt = 34600 + index * 240;
  const o = useTransform(timeMs, [inAt, inAt + 360], [0, 1], { clamp: true });
  const x = useTransform(timeMs, [inAt, inAt + 360], [16, 0], { clamp: true });
  const tagAt = inAt + 520;
  const tagO = useTransform(timeMs, [tagAt, tagAt + 380], [0, 1], { clamp: true });
  const tagX = useTransform(timeMs, [tagAt, tagAt + 380], [12, 0], { clamp: true });

  return (
    <motion.div style={{ opacity: o, x }} className="rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-zinc-200">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-bold text-zinc-900">{bill.name}</span>
        <span className="text-[14px] font-extrabold text-zinc-900">{bill.amount}</span>
      </div>
      <motion.div style={{ opacity: tagO, x: tagX }} className="mt-1.5 flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 12h14m0 0l-5-5m5 5l-5 5" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[12px] font-semibold text-emerald-600">Routes to {bill.route}</span>
        <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          {bill.tone}
        </span>
      </motion.div>
    </motion.div>
  );
}

function WalletSceneBase({ timeMs }: { timeMs: MotionValue<number> }) {
  // "Add a card" toggles into a real linked card on click.
  const addPress = useTransform(timeMs, [33500, 33700, 33950], [1, 0.97, 1], { clamp: true });
  const addDashO = useTransform(timeMs, [33700, 34050], [1, 0], { clamp: true });
  const addedO = useTransform(timeMs, [33800, 34250], [0, 1], { clamp: true });
  const addedX = useTransform(timeMs, [33800, 34250], [-14, 0], { clamp: true });

  return (
    <div className="absolute inset-0 flex items-center justify-center gap-6 bg-gradient-to-b from-[#f6f7fb] to-[#edeff5] px-[70px]">
      {/* Wallet panel */}
      <div className="flex h-[440px] w-[380px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_90px_-30px_rgba(15,23,42,0.35)] ring-1 ring-zinc-200">
        <div className="border-b border-zinc-100 px-5 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Your wallet</p>
          <p className="text-[17px] font-extrabold text-zinc-900">Linked cards</p>
        </div>
        <div className="flex-1 space-y-2.5 px-5 py-4">
          {WALLET_CARDS.map((c, i) => (
            <WalletRow key={c.name} timeMs={timeMs} name={c.name} meta={c.meta} index={i} />
          ))}

          {/* Add-a-card row that toggles to a real card */}
          <div className="relative h-[54px]">
            <motion.div
              style={{ scale: addPress, opacity: addDashO }}
              className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-[13px] font-bold text-zinc-400"
            >
              <span className="text-[18px] leading-none">+</span> Add a card
            </motion.div>
            <motion.div
              style={{ opacity: addedO, x: addedX }}
              className="absolute inset-0 flex items-center gap-3 rounded-xl bg-white px-3 ring-1 ring-zinc-200"
            >
              <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-violet-800">
                <span className="h-2.5 w-3.5 rounded-[2px] bg-gradient-to-br from-amber-200 to-amber-500" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-zinc-900">BMO CashBack</p>
                <p className="truncate text-[11px] text-zinc-400">Mastercard · Cashback</p>
              </div>
              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bills panel */}
      <div className="flex h-[440px] w-[420px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_90px_-30px_rgba(15,23,42,0.35)] ring-1 ring-zinc-200">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Bill pay</p>
            <p className="text-[17px] font-extrabold text-zinc-900">Auto-routed bills</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            Automatic
          </span>
        </div>
        <div className="flex-1 space-y-2.5 px-5 py-4">
          {BILLS.map((b, i) => (
            <BillRow key={b.name} timeMs={timeMs} bill={b} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const WalletScene = memo(WalletSceneBase);
