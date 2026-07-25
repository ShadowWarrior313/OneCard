"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CardProduct } from "@onecard/shared-types";
import { CARD_CATALOG, getCardById } from "@/data/cards";

const STORAGE_KEY = "onecard_wallet_v2";
const LEGACY_KEY = "onecard_wallet_v1";
const DEFAULT_IDS = ["amex_cobalt", "cibc_dividend_infinite", "scotia_momentum", "rbc_ion"];

interface WalletContextValue {
  cardIds: string[];
  cards: CardProduct[];
  /** True after the initial localStorage read (or confirmed empty) has applied. */
  hydrated: boolean;
  toggleCard: (id: string) => void;
  hasCard: (id: string) => boolean;
  defaultCardId: string | undefined;
  setDefaultCardId: (id: string) => void;
  businessCardId: string | undefined;
  setBusinessCardId: (id: string | undefined) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [cardIds, setCardIds] = useState<string[]>(DEFAULT_IDS);
  const [defaultCardId, setDefaultCardId] = useState<string | undefined>(
    "cibc_dividend_infinite",
  );
  const [businessCardId, setBusinessCardIdState] = useState<string | undefined>(
    undefined,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw) as {
          cardIds?: string[];
          defaultCardId?: string;
          businessCardId?: string;
        };
        if (parsed.cardIds?.length) setCardIds(parsed.cardIds);
        if (parsed.defaultCardId) setDefaultCardId(parsed.defaultCardId);
        if (parsed.businessCardId) setBusinessCardIdState(parsed.businessCardId);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cardIds, defaultCardId, businessCardId }),
    );
  }, [cardIds, defaultCardId, businessCardId, hydrated]);

  const cards = useMemo(
    () =>
      cardIds
        .map(getCardById)
        .filter((c): c is CardProduct => !!c),
    [cardIds],
  );

  const toggleCard = useCallback((id: string) => {
    if (!CARD_CATALOG.some((c) => c.cardId === id)) return;
    setCardIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      return next;
    });
    setBusinessCardIdState((biz) => (biz === id ? undefined : biz));
  }, []);

  const setBusinessCardId = useCallback(
    (id: string | undefined) => {
      if (id && !cardIds.includes(id)) return;
      setBusinessCardIdState(id);
    },
    [cardIds],
  );

  useEffect(() => {
    if (businessCardId && !cardIds.includes(businessCardId)) {
      setBusinessCardIdState(undefined);
    }
  }, [cardIds, businessCardId]);

  const hasCard = useCallback((id: string) => cardIds.includes(id), [cardIds]);

  return (
    <WalletContext.Provider
      value={{
        cardIds,
        cards,
        hydrated,
        toggleCard,
        hasCard,
        defaultCardId,
        setDefaultCardId,
        businessCardId,
        setBusinessCardId,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
