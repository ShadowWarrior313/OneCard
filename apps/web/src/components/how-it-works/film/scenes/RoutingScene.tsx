"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { Badge, FilmCardThumb, OneCardMark } from "../ui";

/**
 * Scene 3 — Routing (hero beat). Detect category, cascade the wallet analysis,
 * rise the winner to the top (FLIP-style transform), badge + connector +
 * "charged to" confirmation. Rows use realistic card art (matching the wallet).
 *
 * Winner row centre (after rise) ≈ (500, 252) — kept in sync with cursorPath.ts.
 */

interface CardRow {
  id: string;
  issuer: string;
  name: string;
  rate: string;
  sub: string;
  value: string;
  best?: boolean;
}

const CARDS: CardRow[] = [
  { id: "amex_cobalt", issuer: "American Express", name: "Amex Cobalt", rate: "5×", sub: "Membership Rewards", value: "+$8.47", best: true },
  { id: "scotia_gold_amex", issuer: "Scotiabank", name: "Scotia Gold Amex", rate: "4×", sub: "Scene+ points", value: "+$6.10" },
  { id: "td_cashback_infinite", issuer: "TD", name: "TD Cash Back", rate: "3%", sub: "Cashback", value: "+$3.55" },
  { id: "cibc_dividend_infinite", issuer: "CIBC", name: "CIBC Dividend", rate: "2%", sub: "Cashback", value: "+$2.37" },
  { id: "rbc_ion", issuer: "RBC", name: "RBC Ion", rate: "1.5×", sub: "Avion points", value: "+$1.78" },
];

const INITIAL_ORDER = ["td_cashback_infinite", "rbc_ion", "amex_cobalt", "scotia_gold_amex", "cibc_dividend_infinite"];
const FINAL_ORDER = ["amex_cobalt", "scotia_gold_amex", "td_cashback_infinite", "cibc_dividend_infinite", "rbc_ion"];
const ROW_H = 58;

function RoutingRow({ timeMs, card }: { timeMs: MotionValue<number>; card: CardRow }) {
  const initialIndex = INITIAL_ORDER.indexOf(card.id);
  const finalIndex = FINAL_ORDER.indexOf(card.id);
  const inAt = 21200 + initialIndex * 150;

  const y = useTransform(timeMs, [24500, 26000], [initialIndex * ROW_H, finalIndex * ROW_H], { clamp: true });
  const opacity = useTransform(timeMs, [inAt, inAt + 360], [0, 1], { clamp: true });
  const x = useTransform(timeMs, [inAt, inAt + 360], [-18, 0], { clamp: true });

  const bestRing = useTransform(timeMs, [26000, 26600], [0, 1], { clamp: true });
  const bestBadge = useTransform(timeMs, [26100, 26700], [0, 1], { clamp: true });
  const press = useTransform(timeMs, [25100, 25300, 25600], card.best ? [1, 0.97, 1] : [1, 1, 1], { clamp: true });

  return (
    <motion.div style={{ y, opacity }} className="absolute inset-x-0">
      <motion.div
        style={{ x, scale: press }}
        className="relative flex h-[50px] items-center gap-3 rounded-xl bg-white px-3 ring-1 ring-zinc-200"
      >
        <FilmCardThumb cardId={card.id} issuer={card.issuer} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-zinc-900">{card.name}</p>
          <p className="truncate text-[11px] text-zinc-400">{card.sub}</p>
        </div>
        <span className="text-[14px] font-bold text-zinc-500">{card.rate}</span>
        <span className="w-14 text-right text-[14px] font-extrabold text-zinc-900">{card.value}</span>

        {card.best && (
          <>
            <motion.span
              style={{ opacity: bestRing }}
              className="pointer-events-none absolute -inset-[3px] rounded-xl ring-2 ring-emerald-500"
            />
            <motion.span style={{ opacity: bestBadge }} className="absolute -right-2 -top-2.5">
              <Badge tone="mint">BEST</Badge>
            </motion.span>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function RoutingSceneBase({ timeMs }: { timeMs: MotionValue<number> }) {
  const detectingO = useTransform(timeMs, [21200, 21700, 22600, 23000], [0, 1, 1, 0], { clamp: true });
  const catO = useTransform(timeMs, [22800, 23300], [0, 1], { clamp: true });
  const connector = useTransform(timeMs, [26700, 27500], [0, 1], { clamp: true });
  const chargedO = useTransform(timeMs, [27700, 28300], [0, 1], { clamp: true });
  const chargedY = useTransform(timeMs, [27700, 28300], [10, 0], { clamp: true });

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#f6f7fb] to-[#eef0f6]">
      <div className="absolute left-[220px] top-[70px] flex h-[485px] w-[560px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_90px_-30px_rgba(15,23,42,0.4)] ring-1 ring-zinc-200">
        {/* header */}
        <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-4">
          <OneCardMark size={26} />
          <span className="text-[15px] font-bold text-zinc-900">Routing</span>
          <span className="text-[13px] font-medium text-zinc-400">· OneCard</span>
          <span className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> live
          </span>
        </div>

        <div className="flex-1 px-6 pt-4">
          {/* merchant + category */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Merchant</p>
              <p className="text-[17px] font-extrabold text-zinc-900">Loblaws · $118.40</p>
            </div>
            <div className="relative h-7 w-[120px]">
              <motion.span style={{ opacity: detectingO }} className="absolute right-0 top-1 text-[13px] font-medium text-zinc-400">
                Detecting…
              </motion.span>
              <motion.span style={{ opacity: catO }} className="absolute right-0 top-0">
                <Badge tone="purple">Groceries</Badge>
              </motion.span>
            </div>
          </div>

          {/* analysis list */}
          <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
            Wallet analysis
          </p>
          <div className="relative" style={{ height: ROW_H * CARDS.length }}>
            {CARDS.map((card) => (
              <RoutingRow key={card.id} timeMs={timeMs} card={card} />
            ))}
          </div>
        </div>

        {/* charged-to footer */}
        <div className="relative px-6 pb-5">
          <motion.div
            style={{ scaleX: connector, transformOrigin: "left" }}
            className="mb-3 h-0.5 w-full rounded bg-gradient-to-r from-emerald-500 to-emerald-300"
          />
          <motion.div
            style={{ opacity: chargedO, y: chargedY }}
            className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-[14px] font-extrabold text-emerald-900">Charged to Amex Cobalt</p>
              <p className="text-[12px] font-medium text-emerald-700">Rewards post on your existing account</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export const RoutingScene = memo(RoutingSceneBase);
