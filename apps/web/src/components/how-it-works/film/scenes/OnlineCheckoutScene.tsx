"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { OneCardFace } from "@/components/OneCardFace";
import { BrowserChrome, Badge, OneCardMark } from "../ui";

/**
 * Scene 1 — Online checkout. The page scrolls to the payment area, the OneCard
 * extension popup slides in (matching the real extension overlay), the cursor
 * clicks "Use Card", and the fields auto-fill.
 *
 * Popup geometry (stage coords): left 618, top 88, width 310.
 * "Use Card" button centre ≈ (773, 448) — kept in sync with cursorPath.ts.
 */
function OnlineCheckoutSceneBase({ timeMs }: { timeMs: MotionValue<number> }) {
  const scrollY = useTransform(timeMs, [1500, 4300], [0, -262], { clamp: true });
  const payHL = useTransform(timeMs, [4200, 4700, 9200, 9700], [0, 1, 1, 0], { clamp: true });

  const popupO = useTransform(timeMs, [4200, 4750], [0, 1], { clamp: true });
  const popupX = useTransform(timeMs, [4200, 4800], [40, 0], { clamp: true });
  const btnPress = useTransform(timeMs, [6450, 6650, 6900], [1, 0.97, 1], { clamp: true });

  const fillNum = useTransform(timeMs, [7000, 7550], [0, 1], { clamp: true });
  const fillName = useTransform(timeMs, [7550, 8050], [0, 1], { clamp: true });
  const fillExp = useTransform(timeMs, [8050, 8450], [0, 1], { clamp: true });
  const fillCvc = useTransform(timeMs, [8450, 8850], [0, 1], { clamp: true });

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#eef2f8] to-[#e6ebf3]">
      {/* Browser window */}
      <div className="absolute left-[60px] top-[40px] h-[545px] w-[880px] overflow-hidden rounded-2xl bg-white shadow-[0_40px_90px_-30px_rgba(15,23,42,0.45)] ring-1 ring-zinc-200">
        <BrowserChrome url="freshmart.ca/checkout" />

        {/* Scrolling page viewport */}
        <div className="relative h-[509px] overflow-hidden">
          <motion.div style={{ y: scrollY }} className="absolute inset-x-0 top-0 px-10 pt-7">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-zinc-400">
              FreshMart · Secure checkout
            </p>

            {/* Cart */}
            <h2 className="mt-1 text-[22px] font-bold text-zinc-900">Your cart</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Organic groceries — weekly box", "$74.00"],
                ["Cold-pressed juices ×6", "$28.40"],
                ["Sourdough & pastries", "$16.00"],
              ].map(([label, price]) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100">
                  <span className="text-[15px] text-zinc-700">{label}</span>
                  <span className="text-[15px] font-semibold text-zinc-900">{price}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 px-4 pt-4">
              <span className="text-[16px] font-semibold text-zinc-500">Order total</span>
              <span className="text-[22px] font-extrabold text-zinc-900">$118.40</span>
            </div>

            {/* Payment */}
            <h2 className="mt-8 text-[22px] font-bold text-zinc-900">Payment</h2>
            <div className="mt-4 space-y-3">
              <Field label="Email" value="alex@freshmail.com" filled={null} />

              <div className="relative">
                <Field
                  label="Card number"
                  placeholder="1234 1234 1234 1234"
                  value="•••• •••• •••• 1009"
                  brand="amex"
                  filled={fillNum}
                />
                <motion.span
                  style={{ opacity: payHL }}
                  className="pointer-events-none absolute -inset-1.5 rounded-xl ring-2 ring-brand-ocean"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Expiry" placeholder="MM / YY" value="07 / 28" filled={fillExp} />
                <Field label="CVC" placeholder="•••" value="••••" filled={fillCvc} />
              </div>
              <Field label="Name on card" placeholder="Full name" value="Alex Chen" filled={fillName} />

              <div className="mt-1 flex h-12 items-center justify-center rounded-xl bg-brand-ink text-[15px] font-bold text-white">
                Pay $118.40
              </div>
            </div>
          </motion.div>

          {/* Extension popup — matches the real OneCard extension overlay */}
          <motion.div
            style={{ opacity: popupO, x: popupX }}
            className="absolute right-3 top-3 w-[310px] overflow-hidden rounded-[20px] bg-gradient-to-b from-[#f7fbff] via-white to-[#f8fafc] shadow-[0_24px_60px_-16px_rgba(15,23,42,0.5)] ring-1 ring-zinc-200/80"
          >
            {/* header */}
            <div className="flex items-center gap-2 border-b border-zinc-100 bg-white/70 px-4 py-3 backdrop-blur-sm">
              <OneCardMark size={26} />
              <span className="text-[16px] font-extrabold tracking-tight text-zinc-900">OneCard</span>
              <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            <div className="px-4 pb-4 pt-3">
              {/* card visual */}
              <div className="mx-auto w-[172px]">
                <OneCardFace />
              </div>

              <h3 className="mt-3 text-[19px] font-extrabold leading-tight text-zinc-700">
                American Express Cobalt Card
              </h3>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone="mint">5× groceries</Badge>
                <span className="text-[13px] font-bold text-emerald-600">+$8.47</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-snug text-zinc-500">
                OneCard found your best card for this checkout. Pick this card manually when you pay.
              </p>

              <div className="mt-2.5 border-l-[3px] border-brand-ocean bg-sky-50/80 px-3 py-2 text-[11.5px] leading-snug text-sky-800">
                Runner-up: American Express Gold Rewards Card. Category: groceries.
              </div>

              <motion.div
                style={{ scale: btnPress }}
                className="mt-3 flex h-10 items-center justify-center rounded-full bg-brand-ink text-[14px] font-bold text-white"
              >
                Use Card
              </motion.div>
              <div className="mt-2 flex h-10 items-center justify-center rounded-full text-[14px] font-bold text-zinc-700 ring-1 ring-zinc-300">
                Dismiss
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  brand,
  filled,
}: {
  label: string;
  value: string;
  placeholder?: string;
  brand?: "amex";
  filled: MotionValue<number> | null;
}) {
  const isStatic = filled === null;
  return (
    <div>
      <p className="mb-1 text-[12px] font-semibold text-zinc-500">{label}</p>
      <div className="relative flex h-11 items-center rounded-xl bg-white px-3.5 text-[15px] ring-1 ring-zinc-200">
        {placeholder && <span className="text-zinc-300">{placeholder}</span>}
        {isStatic ? (
          <span className="absolute left-3.5 font-medium text-zinc-800">{value}</span>
        ) : (
          <motion.span
            style={{ opacity: filled! }}
            className="absolute left-3.5 flex items-center gap-2 bg-white pr-2 font-medium text-zinc-900"
          >
            {brand === "amex" && (
              <span className="flex h-4 w-6 items-center justify-center rounded bg-[#1f5fa8] text-[7px] font-black text-white">
                AMEX
              </span>
            )}
            {value}
          </motion.span>
        )}
      </div>
    </div>
  );
}

export const OnlineCheckoutScene = memo(OnlineCheckoutSceneBase);
