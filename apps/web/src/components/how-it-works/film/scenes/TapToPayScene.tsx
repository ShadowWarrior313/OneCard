"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { OneCardFace } from "@/components/OneCardFace";
import { PhoneFrame } from "../ui";

/**
 * Scene 2 — In person. The OneCard sits in a phone wallet; the phone moves to a
 * Stripe-reader-style POS terminal, a contactless ripple fires on contact, and
 * the terminal flips to a green "Approved" state.
 */
function TapToPaySceneBase({ timeMs }: { timeMs: MotionValue<number> }) {
  // Phone glides toward the reader, taps, eases back.
  const phoneX = useTransform(timeMs, [12400, 14400, 16600, 17600], [-12, 150, 150, 96], { clamp: true });
  const phoneY = useTransform(timeMs, [12400, 14400], [10, -6], { clamp: true });
  const phoneRot = useTransform(timeMs, [12400, 14400], [-3, 1], { clamp: true });

  const rippleO = useTransform(timeMs, [14500, 14900, 15600], [0, 0.9, 0], { clamp: true });
  const rippleS = useTransform(timeMs, [14500, 15600], [0.3, 2.1], { clamp: true });

  const tapO = useTransform(timeMs, [11400, 12000, 15000, 15300], [0, 1, 1, 0], { clamp: true });
  const okO = useTransform(timeMs, [15000, 15500], [0, 1], { clamp: true });
  const okS = useTransform(timeMs, [15000, 15500], [0.9, 1], { clamp: true });
  const glyphPulse = useTransform(timeMs, [12000, 12700, 13400, 14100, 14600], [0.4, 1, 0.4, 1, 0.4], { clamp: true });

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c1322] via-[#0a0f1c] to-[#0b1424]">
      {/* soft glow */}
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-ocean/10 blur-3xl" />

      {/* Phone with OneCard in wallet */}
      <motion.div
        style={{ x: phoneX, y: phoneY, rotate: phoneRot }}
        className="absolute left-[150px] top-[95px] h-[440px] w-[290px]"
      >
        <PhoneFrame>
          <div className="flex h-full flex-col bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 pt-10">
            <p className="text-center text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
              Wallet
            </p>
            <div className="mx-auto mt-4 w-[235px]">
              <OneCardFace />
            </div>
            <div className="mt-5 rounded-2xl bg-white p-3 text-center ring-1 ring-zinc-200">
              <p className="text-[12px] font-medium text-zinc-500">Hold near reader</p>
              <p className="mt-0.5 text-[15px] font-bold text-zinc-900">Ready to pay</p>
            </div>
          </div>
        </PhoneFrame>
      </motion.div>

      {/* POS terminal (Stripe-reader style) */}
      <div className="absolute right-[120px] top-[150px] h-[320px] w-[250px] rounded-[2rem] bg-gradient-to-b from-[#2b2f3a] to-[#171a22] p-4 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        {/* contactless glyph */}
        <motion.div style={{ opacity: glyphPulse }} className="absolute left-1/2 top-3 -translate-x-1/2">
          <ContactlessGlyph />
        </motion.div>

        {/* screen */}
        <div className="relative mt-9 h-[200px] overflow-hidden rounded-2xl bg-[#0b0e15] ring-1 ring-white/10">
          {/* default: tap to pay */}
          <motion.div style={{ opacity: tapO }} className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-zinc-400">Loblaws</p>
            <p className="mt-1 text-[34px] font-extrabold text-white">$118.40</p>
            <p className="mt-2 text-[14px] font-medium text-brand-ocean">Tap to pay</p>
          </motion.div>

          {/* approved */}
          <motion.div style={{ opacity: okO }} className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600">
            <motion.div style={{ scale: okS }} className="flex flex-col items-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="mt-3 text-[20px] font-extrabold text-white">Approved</p>
              <p className="text-[13px] font-medium text-white/80">$118.40 · Loblaws</p>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          <span className="h-1.5 w-10 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        </div>
      </div>

      {/* contact ripple */}
      <motion.span
        style={{ opacity: rippleO, scale: rippleS }}
        className="absolute right-[200px] top-[185px] h-24 w-24 rounded-full ring-2 ring-brand-ocean"
      />
    </div>
  );
}

function ContactlessGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      {[5, 9, 13].map((r, i) => (
        <path
          key={r}
          d={`M${9 + i * 2} ${12 - r * 0.7}a${r} ${r} 0 010 ${r * 1.4}`}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export const TapToPayScene = memo(TapToPaySceneBase);
