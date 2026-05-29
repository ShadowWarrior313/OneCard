"use client";

import { motion } from "framer-motion";
import { WalletCardVisual } from "@/components/wallet/WalletCardVisual";
import { getDemoWalletCards } from "@/components/demo/demoWalletData";
import {
  WALLET_PEEK,
  WALLET_SLIDE_UP,
  WALLET_SPRING,
  walletSlideHeadroom,
} from "@/lib/walletFoldMotion";

const WALLET_INNER_W = 252;
const WALLET_LIP_H = 36;
/** 11rem shell inner (minus frame) minus DemoPhoneSlide px-3 */
const PHONE_CONTENT_W = 11 * 16 - 10 - 24;
const PHONE_FULL_SCALE = (PHONE_CONTENT_W - 6) / WALLET_INNER_W;

export function DemoWalletStrip({
  activeIndex,
  showTapHint = false,
  fullWidth = false,
  /** Slide active card out like PhoneWalletFold; otherwise peek highlight only */
  expandActive = false,
}: {
  /** -1 = none selected */
  activeIndex: number;
  showTapHint?: boolean;
  fullWidth?: boolean;
  expandActive?: boolean;
}) {
  const cards = getDemoWalletCards();
  const scale = fullWidth ? PHONE_FULL_SCALE : 0.5;
  const hasActive = activeIndex >= 0;
  const headroom = expandActive ? walletSlideHeadroom(activeIndex) : 0;
  const stackH = WALLET_PEEK + (cards.length - 1) * WALLET_PEEK;
  const peekStackBottom = (cards.length - 1) * WALLET_PEEK + 44;
  const cardAreaPadTop = expandActive && hasActive ? WALLET_SLIDE_UP + 16 : 12;
  /** Expanded card slides up — only reserve peek stack depth, not a full card below */
  const cardAreaMinH =
    expandActive && hasActive ? peekStackBottom + 16 : stackH + 32;
  const innerH = headroom + WALLET_LIP_H + cardAreaPadTop + cardAreaMinH + 8;
  const outerW = WALLET_INNER_W * scale;
  const outerH = innerH * scale;

  return (
    <motion.div
      className={`relative shrink-0 ${fullWidth ? "mx-auto" : ""}`}
      initial={false}
      animate={{ width: outerW, height: outerH }}
      transition={WALLET_SPRING}
      style={{ maxWidth: "100%" }}
    >
      <div
        className="absolute top-0"
        style={{
          width: WALLET_INNER_W,
          height: innerH,
          ...(fullWidth
            ? {
                left: "50%",
                transform: `translateX(-50%) scale(${scale})`,
                transformOrigin: "top center",
              }
            : {
                left: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }),
        }}
      >
        <motion.div
          aria-hidden
          className="shrink-0"
          initial={false}
          animate={{ height: headroom }}
          transition={WALLET_SPRING}
        />

        <div className="phone-leather-wallet overflow-visible rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
          <div className="phone-leather-lip relative overflow-hidden rounded-t-2xl px-3 pb-2 pt-2.5">
            <p className="relative text-center text-[0.55rem] font-bold uppercase tracking-[0.18em] text-amber-200/70">
              Wallet
            </p>
          </div>

          <div
            className="relative overflow-visible rounded-b-2xl px-2 pb-2"
            style={{ paddingTop: cardAreaPadTop, minHeight: cardAreaMinH }}
          >
            {cards.map((card, i) => {
              const isActive = activeIndex === i;
              const isBehindActive = hasActive && i < activeIndex;

              return (
                <motion.div
                  key={card.cardId}
                  className="absolute left-2 right-2 origin-top"
                  style={{
                    top: i * WALLET_PEEK,
                    zIndex: isActive ? 40 : i + 1,
                  }}
                  animate={{
                    y: expandActive
                      ? isActive
                        ? -WALLET_SLIDE_UP
                        : isBehindActive
                          ? -4
                          : 0
                      : isActive
                        ? -10
                        : 0,
                  }}
                  transition={WALLET_SPRING}
                >
                  {isActive && expandActive ? (
                    <WalletCardVisual card={card} active />
                  ) : (
                    <WalletCardVisual card={card} peek active={isActive} />
                  )}
                  {isActive && showTapHint && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 top-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white"
                    >
                      <span className="text-[0.45rem] font-bold text-white">✓</span>
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
