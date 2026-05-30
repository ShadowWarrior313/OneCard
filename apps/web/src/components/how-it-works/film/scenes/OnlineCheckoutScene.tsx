"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { BrowserChrome, Badge } from "../ui";

/**
 * Scene 1 — Online checkout. A clean shopping site in a browser window:
 * the page scrolls down to the payment area, the OneCard extension popup
 * slides in recommending the best card, and the card fields auto-fill.
 *
 * Authored in absolute stage coordinates. Cursor anchor for "Use this card"
 * button ≈ (800, 205) — kept in sync with cursorPath.ts.
 */
function OnlineCheckoutSceneBase({ timeMs }: { timeMs: MotionValue<number> }) {
  const scrollY = useTransform(timeMs, [1500, 4300], [0, -255], { clamp: true });
  const cartHL = useTransform(timeMs, [2000, 2500, 3400, 3900], [0, 1, 1, 0], { clamp: true });
  const payHL = useTransform(timeMs, [4200, 4700, 9200, 9700], [0, 1, 1, 0], { clamp: true });

  const popupO = useTransform(timeMs, [4200, 4700], [0, 1], { clamp: true });
  const popupX = useTransform(timeMs, [4200, 4750], [44, 0], { clamp: true });
  const btnPress = useTransform(timeMs, [6450, 6650, 6900], [1, 0.97, 1], { clamp: true });

  const fillNum = useTransform(timeMs, [7000, 7550], [0, 1], { clamp: true });
  const fillName = useTransform(timeMs, [7550, 8050], [0, 1], { clamp: true });
  const fillExp = useTransform(timeMs, [8050, 8450], [0, 1], { clamp: true });
  const fillCvc = useTransform(timeMs, [8450, 8850], [0, 1], { clamp: true });
  const doneO = useTransform(timeMs, [9050, 9500], [0, 1], { clamp: true });
  const doneY = useTransform(timeMs, [9050, 9500], [8, 0], { clamp: true });

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
            <div className="relative mt-3 flex items-center justify-between border-t border-zinc-200 px-4 pt-4">
              <span className="text-[16px] font-semibold text-zinc-500">Order total</span>
              <span className="text-[22px] font-extrabold text-zinc-900">$118.40</span>
              <motion.span
                style={{ opacity: cartHL }}
                className="pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-xl ring-2 ring-brand-purple/70"
              />
            </div>

            {/* Payment */}
            <h2 className="mt-9 text-[22px] font-bold text-zinc-900">Payment</h2>
            <div className="mt-4 space-y-3 pb-10">
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

              <div className="flex h-12 items-center justify-center rounded-xl bg-brand-ink text-[15px] font-bold text-white">
                Pay $118.40
              </div>
            </div>
          </motion.div>

          {/* Extension popup (browser-extension style, top-right) */}
          <motion.div
            style={{ opacity: popupO, x: popupX }}
            className="absolute right-3 top-3 w-[250px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-18px_rgba(15,23,42,0.5)] ring-1 ring-zinc-200"
          >
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3.5 py-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-ink text-[10px] font-black text-white">1</span>
              <span className="text-[13px] font-bold text-zinc-900">OneCard</span>
              <span className="ml-auto text-[11px] font-medium text-zinc-400">extension</span>
            </div>
            <div className="px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Best card here</p>
              <p className="mt-1 text-[16px] font-extrabold text-zinc-900">Amex Cobalt</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone="mint">5× groceries</Badge>
                <span className="text-[13px] font-bold text-emerald-600">+$8.47</span>
              </div>
              <motion.div
                style={{ scale: btnPress }}
                className="mt-3 flex h-9 items-center justify-center rounded-lg bg-brand-ink text-[13px] font-bold text-white"
              >
                Use this card
              </motion.div>
            </div>
          </motion.div>

          {/* Filled confirmation toast */}
          <motion.div
            style={{ opacity: doneO, y: doneY }}
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white shadow-lg"
          >
            <CheckIcon /> Card details filled
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
        {placeholder && (
          <span className="text-zinc-300">{placeholder}</span>
        )}
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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const OnlineCheckoutScene = memo(OnlineCheckoutSceneBase);
