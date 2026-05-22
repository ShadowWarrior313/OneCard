"use client";

import { routeTransaction } from "@onecard/rewards-engine";
import type { RoutingDecision, RoutingMode } from "@onecard/shared-types";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  ISSUER_GROUPS,
  cardsByIssuer,
  getCardById,
} from "@/data/cards";
import { MERCHANT_GROUPS, MERCHANT_PRESETS } from "@/data/merchants";

const ROUTING_MODES: { id: RoutingMode; label: string }[] = [
  { id: "virtual_provisioning", label: "Digital wallet (VCN)" },
  { id: "network_dependent", label: "Visa / Mastercard rail" },
  { id: "closed_loop", label: "Closed-loop" },
];

export function ScenarioSimulator() {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "amex_cobalt",
    "cibc_dividend_infinite",
    "scotia_momentum",
  ]);
  const [merchantId, setMerchantId] = useState("uber_eats");
  const [amount, setAmount] = useState(75);
  const [defaultCardId, setDefaultCardId] = useState("cibc_dividend_infinite");
  const [mode, setMode] = useState<RoutingMode>("virtual_provisioning");
  const [expandedIssuer, setExpandedIssuer] = useState<string | null>(
    "American Express",
  );

  const merchant = MERCHANT_PRESETS.find((m) => m.id === merchantId)!;

  const decision: RoutingDecision | null = useMemo(() => {
    const cards = selectedIds
      .map(getCardById)
      .filter((c): c is NonNullable<typeof c> => !!c);
    if (cards.length < 1) return null;
    try {
      return routeTransaction({
        mode,
        transaction: {
          amount,
          merchantName: merchant.name,
          mcc: merchant.mcc,
        },
        portfolio: {
          cards,
          usage: [],
          preferences: { preferCashback: false },
          defaultCardId: defaultCardId && selectedIds.includes(defaultCardId)
            ? defaultCardId
            : selectedIds[0],
        },
      });
    } catch {
      return null;
    }
  }, [selectedIds, merchantId, amount, defaultCardId, mode, merchant]);

  function toggleCard(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <section id="simulator" className="oc-section oc-simulator">
      <div className="oc-container">
        <header className="oc-simulator-header">
          <p className="oc-simulator-eyebrow">Try it yourself</p>
          <h2 className="oc-section-title mt-2">Test a real purchase</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Select the Amex and Big Six cards in your wallet, pick a merchant, and
            see which card OneCard would route to.
          </p>
        </header>

        <div className="oc-simulator-grid">
          <div className="oc-simulator-controls">
            <div>
              <label className="oc-label">Your cards</label>
              <p className="oc-field-hint">
                Amex + Canadian Big Six only (demo)
              </p>
              <div className="oc-card-picker space-y-2">
                {ISSUER_GROUPS.map((issuer) => {
                  const open = expandedIssuer === issuer;
                  const cards = cardsByIssuer(issuer);
                  return (
                    <div key={issuer} className="rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIssuer(open ? null : issuer)
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-800"
                      >
                        {issuer}
                        <ChevronDown
                          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <ul className="border-t border-slate-100 px-2 pb-2">
                          {cards.map((card) => {
                            const on = selectedIds.includes(card.cardId);
                            return (
                              <li key={card.cardId}>
                                <button
                                  type="button"
                                  onClick={() => toggleCard(card.cardId)}
                                  className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition sm:text-sm ${
                                    on
                                      ? "bg-slate-900 text-white"
                                      : "hover:bg-slate-50 text-slate-700"
                                  }`}
                                >
                                  <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                      on
                                        ? "border-white bg-white text-slate-900"
                                        : "border-slate-300"
                                    }`}
                                  >
                                    {on && <Check className="h-3 w-3" />}
                                  </span>
                                  {card.displayName}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {selectedIds.length} card{selectedIds.length !== 1 ? "s" : ""}{" "}
                selected
              </p>
            </div>

            <div>
              <label className="oc-label">Merchant</label>
              <select
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="oc-select"
              >
                {MERCHANT_GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {MERCHANT_PRESETS.filter((m) => m.group === group).map(
                      (m) => (
                        <option key={m.id} value={m.id}>
                          {m.icon} {m.name}
                        </option>
                      ),
                    )}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="oc-label">Amount (CAD)</label>
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-2 w-full accent-slate-900"
              />
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-500">$5</span>
                <span className="font-semibold text-slate-900">
                  ${amount.toFixed(0)}
                </span>
                <span className="text-slate-500">$500</span>
              </div>
            </div>

            <div>
              <label className="oc-label">Your “lazy” default card</label>
              <select
                value={defaultCardId}
                onChange={(e) => setDefaultCardId(e.target.value)}
                className="oc-select"
              >
                {selectedIds.map((id) => {
                  const c = getCardById(id);
                  return c ? (
                    <option key={id} value={id}>
                      {c.displayName}
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            <div>
              <label className="oc-label">Routing mode</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ROUTING_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`oc-chip ${
                      mode === m.id ? "oc-chip-active" : "oc-chip-inactive"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <AnimatePresence mode="wait">
              {decision ? (
                <motion.div
                  key={`${decision.selectedCardId}-${merchantId}-${amount}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="oc-result-panel"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-2xl text-white shadow-md shadow-emerald-500/30">
                      {merchant.icon}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        OneCard routes to
                      </p>
                      <h3 className="oc-result-winner">
                        {decision.selectedCardDisplayName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {decision.multiplier}× on {decision.category} · MCC{" "}
                        {merchant.mcc}
                      </p>
                    </div>
                  </div>

                  <p className="oc-result-reason">{decision.reason}</p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Stat
                      label="Reward value"
                      value={`$${(decision.estimatedRewardValueCents / 100).toFixed(2)}`}
                    />
                    <Stat
                      label="vs default"
                      value={`+$${(decision.deltaVsDefaultCents / 100).toFixed(2)}`}
                      highlight
                    />
                    <Stat
                      label="vs 2nd best"
                      value={`+$${(decision.deltaVsNextBestCents / 100).toFixed(2)}`}
                    />
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      All cards ranked
                    </p>
                    <ul className="mt-3 space-y-2">
                      {decision.alternatives.map((alt, i) => (
                        <li
                          key={alt.cardId}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                            i === 0 ? "oc-rank-winner" : "oc-rank-row"
                          }`}
                        >
                          <span>
                            {i + 1}. {alt.displayName}
                            {alt.cappedOut && (
                              <span className="ml-2 text-xs opacity-70">
                                (cap)
                              </span>
                            )}
                          </span>
                          <span className="font-medium">
                            ${(alt.estimatedRewardValueCents / 100).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    Mode: {decision.modeMetadata.mode.replace(/_/g, " ")} ·{" "}
                    {decision.modeMetadata.merchantAcceptance.replace(/_/g, " ")}{" "}
                    acceptance
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-slate-500"
                >
                  Select at least one card to simulate
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-3 text-center ${
        highlight ? "bg-emerald-500 text-white" : "bg-white ring-1 ring-slate-200/80"
      }`}
    >
      <p className={`text-xs ${highlight ? "text-emerald-100" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
