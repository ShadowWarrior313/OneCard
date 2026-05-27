"use client";

import type { RoutingDecision } from "@onecard/shared-types";
import type { MerchantPreset } from "@/data/merchants";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SpendRecord } from "@/lib/spendHistory";

const STORAGE_KEY = "onecard_spend_history_v1";

interface RecordSpendInput {
  merchant: MerchantPreset;
  amount: number;
  purchaseType: "personal" | "business";
  decision: RoutingDecision;
  defaultCardId?: string;
  defaultRewardCents: number;
}

interface SpendContextValue {
  records: SpendRecord[];
  hydrated: boolean;
  recordSpend: (input: RecordSpendInput) => SpendRecord;
  removeRecord: (id: string) => void;
  clearHistory: () => void;
}

const SpendContext = createContext<SpendContextValue | null>(null);

function loadRecords(): SpendRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SpendRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function SpendProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<SpendRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, hydrated]);

  const recordSpend = useCallback((input: RecordSpendInput): SpendRecord => {
    const entry: SpendRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      merchantId: input.merchant.id,
      merchantName: input.merchant.name,
      category: input.decision.category,
      amount: input.amount,
      purchaseType: input.purchaseType,
      selectedCardId: input.decision.selectedCardId,
      selectedCardDisplayName: input.decision.selectedCardDisplayName,
      defaultCardId: input.defaultCardId,
      rewardCents: input.decision.estimatedRewardValueCents,
      defaultRewardCents: input.defaultRewardCents,
      deltaVsDefaultCents: input.decision.deltaVsDefaultCents,
      multiplier: input.decision.multiplier,
    };
    setRecords((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const removeRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setRecords([]);
  }, []);

  const value = useMemo(
    () => ({ records, hydrated, recordSpend, removeRecord, clearHistory }),
    [records, hydrated, recordSpend, removeRecord, clearHistory],
  );

  return <SpendContext.Provider value={value}>{children}</SpendContext.Provider>;
}

export function useSpend() {
  const ctx = useContext(SpendContext);
  if (!ctx) throw new Error("useSpend must be used within SpendProvider");
  return ctx;
}
