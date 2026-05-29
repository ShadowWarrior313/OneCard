"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Receipt } from "lucide-react";
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

function shortBillCardName(name: string): string {
  return name.replace(/American Express/g, "Amex").replace(/ Card$/, "");
}

/** Shrink tabular values so they stay inside the card on narrow phone widths. */
function statValueFontClass(value: string, stacked: boolean): string {
  const len = value.length;
  if (stacked) {
    if (len > 12) return "text-[0.72rem] leading-tight";
    if (len > 9) return "text-sm leading-tight";
    return "text-lg leading-tight";
  }
  if (len > 11) return "text-[0.6rem] leading-tight";
  if (len > 8) return "text-[0.68rem] leading-tight";
  if (len > 6) return "text-xs leading-tight";
  return "text-base leading-tight";
}

function shouldStackSummaryStats(totalFormatted: string, dueSoonFormatted: string): boolean {
  if (totalFormatted.length >= 11) return true;
  if (dueSoonFormatted.length >= 5) return true;
  return totalFormatted.length >= 9 && dueSoonFormatted.length >= 3;
}

function SummaryStat({
  label,
  value,
  stacked,
}: {
  label: string;
  value: string;
  stacked: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/[0.04]">
      <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
      <p
        className={`mt-0.5 max-w-full font-bold tabular-nums text-brand-ink ${
          stacked && value.length > 12
            ? "text-sm leading-snug break-all"
            : statValueFontClass(value, stacked)
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** Compact bill pay inside the homepage phone demo. */
export function PhoneBillPayPanel() {
  const { bills, totalDue, dueSoonCount, payBill, refreshFromWallet } = useBills();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paidId, setPaidId] = useState<string | null>(null);

  useEffect(() => {
    refreshFromWallet();
  }, [refreshFromWallet]);

  const openBills = useMemo(() => bills.filter((b) => b.status !== "paid"), [bills]);
  const paidBills = useMemo(() => bills.filter((b) => b.status === "paid"), [bills]);
  const totalFormatted = formatBillMoney(totalDue);
  const dueSoonFormatted = String(dueSoonCount);
  const stackSummary = shouldStackSummaryStats(totalFormatted, dueSoonFormatted);

  function handlePay(bill: CardBill) {
    setPayingId(bill.id);
    payBill({ billId: bill.id, amount: bill.minimumDue, method: "linked_bank" });
    setPaidId(bill.id);
    setPayingId(null);
    window.setTimeout(() => setPaidId(null), 1600);
  }

  if (bills.length === 0) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center">
        <Receipt className="h-8 w-8 text-brand-muted" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-brand-ink">No statements yet</p>
        <p className="mt-1 text-xs text-brand-muted">Add cards in your wallet first.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 pb-4">
      <p className="text-xs leading-relaxed text-brand-muted">
        Pay issuer statements from one place — synced with your linked cards.
      </p>

      <div className={`grid min-w-0 gap-2 ${stackSummary ? "grid-cols-1" : "grid-cols-2"}`}>
        <SummaryStat label="Total due" value={totalFormatted} stacked={stackSummary} />
        <SummaryStat label="Due soon" value={dueSoonFormatted} stacked={stackSummary} />
      </div>

      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">Open bills</p>
        {openBills.length === 0 ? (
          <p className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-4 text-center text-xs text-brand-muted">
            All caught up — no open statements.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {openBills.map((bill) => {
              const card = getCardById(bill.cardId);
              const isPaying = payingId === bill.id;
              const justPaid = paidId === bill.id;

              return (
                <li
                  key={bill.id}
                  className={`rounded-xl border bg-white px-3 py-2.5 shadow-sm ${
                    justPaid ? "border-emerald-200 bg-emerald-50/80" : "border-zinc-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {card && (
                      <IssuerLogo issuer={card.issuer} cardId={card.cardId} size={32} className="shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-brand-ink">
                        {shortBillCardName(bill.cardName)}
                      </p>
                      <p className="text-[0.65rem] text-brand-muted">
                        Due {formatDueLabel(bill.dueDate)}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[0.55rem] font-semibold ${statusTone(bill.status)}`}
                      >
                        {statusLabel(bill.status)}
                      </span>
                    </div>
                    <div className="min-w-0 max-w-[46%] shrink-0 text-right">
                      <p
                        className={`max-w-full truncate font-bold tabular-nums text-brand-ink ${statValueFontClass(formatBillMoney(bill.statementBalance), true)}`}
                      >
                        {formatBillMoney(bill.statementBalance)}
                      </p>
                      <p
                        className={`max-w-full truncate text-brand-muted ${statValueFontClass(`Min ${formatBillMoney(bill.minimumDue)}`, true)}`}
                      >
                        Min {formatBillMoney(bill.minimumDue)}
                      </p>
                    </div>
                  </div>
                  {justPaid ? (
                    <p className="mt-2 flex items-center justify-center gap-1 text-[0.65rem] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Payment scheduled
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={() => handlePay(bill)}
                      className="mt-2 flex min-h-[40px] w-full items-center justify-center gap-1 rounded-lg bg-brand-ink text-[0.65rem] font-semibold text-white hover:bg-brand-charcoal disabled:opacity-60"
                    >
                      {isPaying ? "Processing…" : "Pay minimum"}
                      {!isPaying && <ChevronRight className="h-3 w-3" aria-hidden />}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {paidBills.length > 0 && (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">Paid</p>
          <ul className="mt-2 space-y-1.5">
            {paidBills.slice(0, 3).map((bill) => (
              <li
                key={bill.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2 text-xs"
              >
                <span className="min-w-0 truncate font-medium text-brand-ink">
                  {shortBillCardName(bill.cardName)}
                </span>
                <span className="shrink-0 font-semibold text-emerald-700">Paid</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-[0.6rem] leading-relaxed text-brand-muted">
        Demo mode — payments are simulated locally.
      </p>
    </div>
  );
}
