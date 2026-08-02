"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWallet } from "@/context/WalletContext";
import {
  appendBillPayment,
  applyBillPayment,
  readBillPayments,
  readStoredBills,
  recomputeBillStatuses,
  seedBillsForCards,
  writeStoredBills,
  type BillPayment,
  type CardBill,
} from "@/lib/cardBills";

type PayBillInput = {
  billId: string;
  amount: number;
  method: BillPayment["method"];
};

type BillsContextValue = {
  bills: CardBill[];
  payments: BillPayment[];
  hydrated: boolean;
  totalDue: number;
  totalMinimumDue: number;
  dueSoonCount: number;
  payBill: (input: PayBillInput) => void;
  toggleAutopay: (billId: string) => void;
  refreshFromWallet: () => void;
};

const BillsContext = createContext<BillsContextValue | null>(null);

export function BillsProvider({ children }: { children: React.ReactNode }) {
  const { cards } = useWallet();
  const [bills, setBills] = useState<CardBill[]>([]);
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const syncWithWallet = useCallback(() => {
    const stored = readStoredBills();
    const storedIds = new Set((stored ?? []).map((b) => b.cardId));
    const walletIds = new Set(cards.map((c) => c.cardId));

    let next: CardBill[];
    if (!stored || stored.length === 0) {
      next = seedBillsForCards(cards);
    } else {
      const kept = stored.filter((b) => walletIds.has(b.cardId));
      const missing = cards.filter((c) => !storedIds.has(c.cardId));
      next = [...kept, ...seedBillsForCards(missing)];
    }
    next = recomputeBillStatuses(next);
    setBills(next);
    writeStoredBills(next);
  }, [cards]);

  useEffect(() => {
    setPayments(readBillPayments());
    syncWithWallet();
    setHydrated(true);
  }, [syncWithWallet]);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredBills(bills);
  }, [bills, hydrated]);

  const payBill = useCallback((input: PayBillInput) => {
    const bill = bills.find((b) => b.id === input.billId);
    if (!bill || bill.status === "paid") return;

    const paidAt = new Date().toISOString();
    const payment: BillPayment = {
      id: `pay_${Date.now()}`,
      billId: bill.id,
      cardId: bill.cardId,
      amount: input.amount,
      paidAt,
      method: input.method,
    };

    appendBillPayment(payment);
    setPayments((prev) => [payment, ...prev]);
    setBills((prev) =>
      recomputeBillStatuses(
        prev.map((b) => (b.id === bill.id ? applyBillPayment(b, input.amount, paidAt) : b)),
      ),
    );
  }, [bills]);

  const toggleAutopay = useCallback((billId: string) => {
    setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, autopay: !b.autopay } : b)));
  }, []);

  const { totalDue, totalMinimumDue, dueSoonCount } = useMemo(() => {
    const open = bills.filter((b) => b.status !== "paid");
    return {
      totalDue: open.reduce((s, b) => s + b.statementBalance, 0),
      totalMinimumDue: open.reduce((s, b) => s + b.minimumDue, 0),
      dueSoonCount: open.filter((b) => b.status === "due_soon" || b.status === "overdue").length,
    };
  }, [bills]);

  const value = useMemo(
    () => ({
      bills,
      payments,
      hydrated,
      totalDue,
      totalMinimumDue,
      dueSoonCount,
      payBill,
      toggleAutopay,
      refreshFromWallet: syncWithWallet,
    }),
    [
      bills,
      payments,
      hydrated,
      totalDue,
      totalMinimumDue,
      dueSoonCount,
      payBill,
      toggleAutopay,
      syncWithWallet,
    ],
  );

  return <BillsContext.Provider value={value}>{children}</BillsContext.Provider>;
}

export function useBills(): BillsContextValue {
  const ctx = useContext(BillsContext);
  if (!ctx) throw new Error("useBills must be used within BillsProvider");
  return ctx;
}
