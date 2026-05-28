"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Landmark,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useBills } from "@/context/BillsContext";
import { IssuerLogo } from "@/components/IssuerLogo";
import { getCardById } from "@/data/cards";
import {
  formatBillMoney,
  formatDueLabel,
  statusLabel,
  statusTone,
  type CardBill,
} from "@/lib/cardBills";

type PayAmount = "minimum" | "statement" | "custom";

export function BillsDashboard() {
  const { bills, payments, totalDue, totalMinimumDue, dueSoonCount, payBill, toggleAutopay, refreshFromWallet } =
    useBills();
  const [payingBill, setPayingBill] = useState<CardBill | null>(null);
  const [payAmount, setPayAmount] = useState<PayAmount>("minimum");
  const [customAmount, setCustomAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"linked_bank" | "onecard_balance">("linked_bank");
  const [paySuccess, setPaySuccess] = useState(false);

  const openBills = useMemo(() => bills.filter((b) => b.status !== "paid"), [bills]);
  const paidBills = useMemo(() => bills.filter((b) => b.status === "paid"), [bills]);

  function openPayModal(bill: CardBill) {
    setPayingBill(bill);
    setPayAmount("minimum");
    setCustomAmount("");
    setPayMethod("linked_bank");
    setPaySuccess(false);
  }

  function closePayModal() {
    setPayingBill(null);
    setPaySuccess(false);
  }

  function resolvedAmount(bill: CardBill): number {
    if (payAmount === "minimum") return bill.minimumDue;
    if (payAmount === "statement") return bill.statementBalance;
    const parsed = Number(customAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.min(parsed, bill.statementBalance);
  }

  function confirmPay() {
    if (!payingBill) return;
    const amount = resolvedAmount(payingBill);
    if (amount <= 0) return;
    payBill({ billId: payingBill.id, amount, method: payMethod });
    setPaySuccess(true);
    window.setTimeout(closePayModal, 1200);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Total due</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-ink">{formatBillMoney(totalDue)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Minimum due</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-ink">
            {formatBillMoney(totalMinimumDue)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Needs attention</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-ink">{dueSoonCount}</p>
          <p className="mt-1 text-xs text-brand-muted">Due soon or overdue</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-muted">
          View, track, and pay statements for cards in your wallet — all in one place.
        </p>
        <button
          type="button"
          onClick={refreshFromWallet}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-brand-ink hover:bg-zinc-50"
        >
          <RefreshCw className="h-4 w-4" />
          Sync wallet cards
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
          <Wallet className="mx-auto h-10 w-10 text-brand-muted" />
          <p className="mt-3 font-semibold text-brand-ink">No cards to bill yet</p>
          <p className="mt-1 text-sm text-brand-muted">Add cards in your wallet to track and pay statements here.</p>
          <Link href="/wallet" className="mt-4 inline-flex text-sm font-semibold text-brand-ink underline">
            Go to wallet
          </Link>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">Open bills</h2>
            {openBills.length === 0 ? (
              <p className="rounded-xl border border-zinc-200 bg-white px-4 py-6 text-sm text-brand-muted">
                All caught up — no open statements right now.
              </p>
            ) : (
              <ul className="space-y-3">
                {openBills.map((bill) => {
                  const card = getCardById(bill.cardId);
                  return (
                    <li key={bill.id} className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          {card && (
                            <IssuerLogo issuer={card.issuer} cardId={card.cardId} size={40} />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-ink">{bill.cardName}</p>
                            <p className="text-xs text-brand-muted">{bill.issuer}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(bill.status)}`}>
                                {statusLabel(bill.status)}
                              </span>
                              {bill.autopay && (
                                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                                  Autopay on
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-brand-muted">Statement balance</p>
                          <p className="text-lg font-bold tabular-nums text-brand-ink">
                            {formatBillMoney(bill.statementBalance)}
                          </p>
                          <p className="mt-1 text-xs text-brand-muted">
                            Min {formatBillMoney(bill.minimumDue)} · due {formatDueLabel(bill.dueDate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
                        <button
                          type="button"
                          onClick={() => openPayModal(bill)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-charcoal"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay bill
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAutopay(bill.id)}
                          className="inline-flex min-h-[40px] items-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-zinc-50"
                        >
                          {bill.autopay ? "Turn off autopay" : "Enable autopay"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {paidBills.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">Recently paid</h2>
              <ul className="space-y-2">
                {paidBills.map((bill) => (
                  <li
                    key={bill.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-brand-ink">{bill.cardName}</p>
                      <p className="text-xs text-brand-muted">
                        Paid {bill.lastPaymentAmount ? formatBillMoney(bill.lastPaymentAmount) : "—"}
                        {bill.lastPaidAt
                          ? ` · ${new Date(bill.lastPaidAt).toLocaleDateString("en-CA")}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Paid
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {payments.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">Payment history</h2>
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                {payments.slice(0, 8).map((p) => {
                  const bill = bills.find((b) => b.id === p.billId);
                  return (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <span className="font-medium text-brand-ink">{bill?.cardName ?? "Card"}</span>
                      <span className="tabular-nums font-semibold text-emerald-700">
                        −{formatBillMoney(p.amount)}
                      </span>
                      <span className="w-full text-xs text-brand-muted sm:w-auto sm:text-right">
                        {new Date(p.paidAt).toLocaleString("en-CA")} ·{" "}
                        {p.method === "linked_bank" ? "Linked bank" : "OneCard balance"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Demo mode: payments are simulated locally. In production, OneCard would connect to issuer or bank bill-pay rails.
      </p>

      {payingBill && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-bill-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            {paySuccess ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <p className="mt-3 text-lg font-semibold text-brand-ink">Payment submitted</p>
              </div>
            ) : (
              <>
                <h3 id="pay-bill-title" className="text-lg font-semibold text-brand-ink">
                  Pay {payingBill.cardName}
                </h3>
                <p className="mt-1 text-sm text-brand-muted">
                  Due {formatDueLabel(payingBill.dueDate)} · statement {formatBillMoney(payingBill.statementBalance)}
                </p>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Amount</p>
                  {(
                    [
                      { id: "minimum" as const, label: `Minimum (${formatBillMoney(payingBill.minimumDue)})` },
                      {
                        id: "statement" as const,
                        label: `Full statement (${formatBillMoney(payingBill.statementBalance)})`,
                      },
                      { id: "custom" as const, label: "Custom amount" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 hover:bg-zinc-50"
                    >
                      <input
                        type="radio"
                        name="pay-amount"
                        checked={payAmount === opt.id}
                        onChange={() => setPayAmount(opt.id)}
                      />
                      <span className="text-sm text-brand-body">{opt.label}</span>
                    </label>
                  ))}
                  {payAmount === "custom" && (
                    <input
                      type="number"
                      min={1}
                      max={payingBill.statementBalance}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="oc-input w-full"
                    />
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Pay from</p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2">
                    <input
                      type="radio"
                      name="pay-method"
                      checked={payMethod === "linked_bank"}
                      onChange={() => setPayMethod("linked_bank")}
                    />
                    <Landmark className="h-4 w-4 text-brand-muted" />
                    <span className="text-sm">Linked bank account</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2">
                    <input
                      type="radio"
                      name="pay-method"
                      checked={payMethod === "onecard_balance"}
                      onChange={() => setPayMethod("onecard_balance")}
                    />
                    <Wallet className="h-4 w-4 text-brand-muted" />
                    <span className="text-sm">OneCard balance</span>
                  </label>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={closePayModal}
                    className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-brand-ink hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmPay}
                    disabled={resolvedAmount(payingBill) <= 0}
                    className="flex-1 rounded-lg bg-brand-ink py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal disabled:opacity-50"
                  >
                    Pay {formatBillMoney(resolvedAmount(payingBill))}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
