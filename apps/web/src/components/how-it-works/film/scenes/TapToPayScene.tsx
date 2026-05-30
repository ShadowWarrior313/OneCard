"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { OneCardFace } from "@/components/OneCardFace";

/**
 * Scene 2 — In person. A normally-proportioned phone (Apple-Pay sheet) moves to
 * a Stripe-reader-style POS terminal; a contactless ripple fires on contact and
 * the terminal flips to a green "Approved" state.
 */
function TapToPaySceneBase({ timeMs }: { timeMs: MotionValue<number> }) {
  const phoneX = useTransform(timeMs, [12400, 14400, 16600, 17600], [-8, 132, 132, 92], { clamp: true });
  const phoneY = useTransform(timeMs, [12400, 14400], [8, -4], { clamp: true });
  const phoneRot = useTransform(timeMs, [12400, 14400], [-2.5, 1.5], { clamp: true });

  const rippleO = useTransform(timeMs, [14500, 14900, 15600], [0, 0.85, 0], { clamp: true });
  const rippleS = useTransform(timeMs, [14500, 15600], [0.3, 2], { clamp: true });

  const tapO = useTransform(timeMs, [11400, 12000, 15000, 15300], [0, 1, 1, 0], { clamp: true });
  const okO = useTransform(timeMs, [15000, 15500], [0, 1], { clamp: true });
  const okS = useTransform(timeMs, [15000, 15600], [0.92, 1], { clamp: true });
  const glyphPulse = useTransform(timeMs, [12000, 12700, 13400, 14100, 14600], [0.45, 1, 0.45, 1, 0.45], { clamp: true });

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c1322] via-[#0a0f1c] to-[#0b1424]">
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-ocean/10 blur-3xl" />

      {/* Phone — normal proportions (232 x 480, aspect ~0.48) */}
      <motion.div
        style={{ x: phoneX, y: phoneY, rotate: phoneRot }}
        className="absolute left-[168px] top-[72px] h-[480px] w-[232px]"
      >
        <div className="relative h-full w-full rounded-[2.4rem] bg-[#0a0a0b] p-[7px] shadow-[0_36px_90px_-22px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-zinc-100">
            {/* dynamic island */}
            <div className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-black" />
            <div className="flex h-full flex-col px-4 pt-12">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Apple Pay
              </p>
              <div className="mx-auto mt-4 w-[196px]">
                <OneCardFace />
              </div>
              <div className="mt-auto mb-7 flex flex-col items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M7 11V8a5 5 0 0110 0v3" stroke="white" strokeWidth="2" />
                    <rect x="5" y="11" width="14" height="9" rx="2.2" fill="white" />
                  </svg>
                </span>
                <p className="text-[13px] font-bold text-zinc-900">Hold Near Reader</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* POS terminal — Stripe-reader style */}
      <div className="absolute right-[150px] top-[150px] h-[360px] w-[256px] rounded-[2rem] bg-gradient-to-b from-[#23262e] to-[#15171d] p-3.5 shadow-[0_36px_80px_-24px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        {/* contactless glyph */}
        <motion.div style={{ opacity: glyphPulse }} className="absolute left-1/2 top-2.5 -translate-x-1/2">
          <ContactlessGlyph />
        </motion.div>

        {/* screen */}
        <div className="relative mt-8 h-[270px] overflow-hidden rounded-[1.4rem] bg-[#0b0e15] ring-1 ring-white/10">
          <motion.div style={{ opacity: tapO }} className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Loblaws</p>
            <p className="mt-2 text-[40px] font-extrabold leading-none text-white">$118.40</p>
            <p className="mt-3 text-[14px] font-semibold text-brand-ocean">Tap to pay</p>
          </motion.div>

          <motion.div style={{ opacity: okO }} className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600">
            <motion.div style={{ scale: okS }} className="flex flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="mt-3 text-[22px] font-extrabold text-white">Approved</p>
              <p className="text-[13px] font-medium text-white/80">$118.40 · Loblaws</p>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-3 flex items-center justify-center">
          <span className="h-1.5 w-16 rounded-full bg-white/25" />
        </div>
      </div>

      {/* contact ripple */}
      <motion.span
        style={{ opacity: rippleO, scale: rippleS }}
        className="absolute right-[212px] top-[178px] h-24 w-24 rounded-full ring-2 ring-brand-ocean"
      />
    </div>
  );
}

function ContactlessGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
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
