"use client";

import { motion } from "framer-motion";
import type { CardProduct } from "@onecard/shared-types";
import { getCardById } from "@/data/cards";
import { getCardAppearance } from "@/data/cardAppearances";
import { OneCardFace } from "@/components/OneCardFace";
import { cardBackgroundStyle, cardTextClass } from "@/lib/cardBackground";
import { useMemo } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Center card width — matches hero stack proportions */
const CENTER_CARD_PX = 240;
const ORBIT_RADIUS = 152;
const ORBIT_CARD_W_REM = 4.35;

const DEFAULT_ORBIT_CARD_IDS = [
  "amex_cobalt",
  "cibc_dividend_infinite",
  "scotia_momentum",
  "bmo_eclipse",
  "rbc_ion",
  "td_cashback",
  "amex_gold",
  "amex_simplycash_preferred",
] as const;

const STAGE = Math.ceil(
  2 * ORBIT_RADIUS + ORBIT_CARD_W_REM * 16 + CENTER_CARD_PX / 1.586 + 40,
);

function stageCenter() {
  return STAGE / 2;
}

function orbitAngle(index: number, count: number): number {
  return (2 * Math.PI * index) / count - Math.PI / 2;
}

function orbitTransform(angleRad: number) {
  const c = stageCenter();
  const cx = c + Math.cos(angleRad) * ORBIT_RADIUS;
  const cy = c + Math.sin(angleRad) * ORBIT_RADIUS;
  const rotateDeg = (angleRad * 180) / Math.PI;
  return {
    cx,
    cy,
    transform: `translate(-50%, -100%) rotate(${rotateDeg}deg)`,
  };
}

function OrbitChip() {
  return (
    <span
      className="h-3 w-4 shrink-0 rounded-sm bg-gradient-to-br from-amber-200/90 via-amber-300/80 to-amber-500/70 shadow-inner ring-1 ring-black/20"
      aria-hidden
    />
  );
}

function LinkedOrbitCard({ card }: { card: CardProduct }) {
  const appearance = getCardAppearance(card.cardId, card.issuer);
  const bg = cardBackgroundStyle(appearance);
  const text = cardTextClass(appearance);

  return (
    <div
      className={`relative aspect-[1.586] w-full overflow-hidden rounded-[0.65rem] shadow-md ring-1 ring-black/10 ${text}`}
      style={bg}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.16),transparent_55%)]" />
      <div className="relative flex h-full items-start p-2">
        <OrbitChip />
      </div>
    </div>
  );
}

function OrbitSlot({
  angleRad,
  zIndex,
  delay,
  card,
}: {
  angleRad: number;
  zIndex: number;
  delay: number;
  card: CardProduct;
}) {
  const { cx, cy, transform } = orbitTransform(angleRad);

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: cx,
        top: cy,
        width: `${ORBIT_CARD_W_REM}rem`,
        zIndex,
      }}
    >
      <div style={{ transform, transformOrigin: "50% 100%" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 0.38, scale: 1 }}
          transition={{ duration: 0.5, delay, ease: EASE }}
        >
          <LinkedOrbitCard card={card} />
        </motion.div>
      </div>
    </div>
  );
}

export function PinwheelWalletVisual() {
  const orbitCards = useMemo(
    () =>
      DEFAULT_ORBIT_CARD_IDS.map((id) => getCardById(id)).filter((c): c is CardProduct =>
        Boolean(c),
      ),
    [],
  );

  return (
    <div className="flex w-full flex-col items-center px-2 py-4 sm:px-4 sm:py-6">
      <div
        className="relative mx-auto max-w-full origin-center scale-[0.78] overflow-visible sm:scale-100"
        style={{ width: STAGE, height: STAGE }}
      >
        {orbitCards.map((card, i) => (
          <OrbitSlot
            key={card.cardId}
            angleRad={orbitAngle(i, orbitCards.length)}
            zIndex={i + 1}
            delay={0.04 + i * 0.04}
            card={card}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="shrink-0"
            style={{ width: CENTER_CARD_PX, transformOrigin: "center center" }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
          >
            <motion.div
              style={{ transformOrigin: "center center" }}
              animate={{ scale: [1, 1.012, 1] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <OneCardFace className="shadow-[0_28px_72px_rgba(0,0,0,0.45)] ring-2 ring-white/20" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <p className="mt-3 text-center text-[0.62rem] font-semibold uppercase tracking-wider text-sky-700 sm:mt-4">
        Your tap card
      </p>
    </div>
  );
}
