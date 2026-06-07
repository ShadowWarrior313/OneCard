"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import type { HubDashboardData, SafeLinkedItem } from "@/data/schema";

/**
 * The reliability layer's UI hook (flagged; never on the public site).
 *
 * Surfaces per-connection health — healthy / stale / reconnect-needed / error —
 * and drives the re-auth path most teams skip: update-mode re-link for Plaid, or
 * a direct re-link for the mock provider. We never show stale data as live: a
 * `stale` or `login_required` connection is called out explicitly.
 */
const STATUS_META: Record<
  SafeLinkedItem["status"],
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  healthy: {
    label: "Up to date",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Icon: CheckCircle2,
  },
  stale: {
    label: "Data may be outdated",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    Icon: Clock,
  },
  login_required: {
    label: "Reconnect needed",
    className: "border-red-200 bg-red-50 text-red-800",
    Icon: AlertTriangle,
  },
  error: {
    label: "Connection error",
    className: "border-red-200 bg-red-50 text-red-800",
    Icon: AlertTriangle,
  },
};

export function ConnectionHealth({
  items,
  onUpdated,
}: {
  items: SafeLinkedItem[];
  onUpdated: (data: HubDashboardData) => void;
}) {
  const [reconnectToken, setReconnectToken] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/hub/sync", { method: "POST" });
    const body = (await response.json()) as HubDashboardData & { error?: string };
    if (response.ok) onUpdated(body);
  }, [onUpdated]);

  const onReconnectSuccess = useCallback(async () => {
    await refresh();
    setReconnectToken(null);
    setBusyId(null);
  }, [refresh]);

  const { open, ready } = usePlaidLink({ token: reconnectToken, onSuccess: onReconnectSuccess });

  useEffect(() => {
    if (reconnectToken && ready) open();
  }, [reconnectToken, ready, open]);

  const reconnect = useCallback(
    async (item: SafeLinkedItem) => {
      setBusyId(item.id);
      setError("");
      try {
        const response = await fetch("/api/hub/reauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        });
        const body = (await response.json()) as {
          provider?: string;
          linkToken?: string;
          error?: string;
        };
        if (!response.ok) throw new Error(body.error ?? "Could not start reconnect");

        if (body.provider !== "plaid" || !body.linkToken) {
          // Mock provider: re-link directly with a healthy token (repairs same item).
          const exchange = await fetch("/api/hub/link-exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicToken: "mock-healthy" }),
          });
          const exchangeBody = (await exchange.json()) as HubDashboardData & { error?: string };
          if (!exchange.ok) throw new Error(exchangeBody.error ?? "Could not reconnect");
          onUpdated(exchangeBody);
          setBusyId(null);
          return;
        }
        // Plaid: open update-mode Link; onReconnectSuccess then syncs.
        setReconnectToken(body.linkToken);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not reconnect");
        setBusyId(null);
      }
    },
    [onUpdated],
  );

  if (items.length === 0) return null;

  return (
    <section className="oc-panel">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-ink">
        <RefreshCw className="h-5 w-5 text-brand-ocean" /> Connections
      </h2>
      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const meta = STATUS_META[item.status];
          return (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-ink">{item.institutionName}</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${meta.className}`}
                  >
                    <meta.Icon className="h-3 w-3" /> {meta.label}
                  </span>
                  {item.lastSyncedAt && (
                    <span className="text-brand-muted">
                      synced {new Date(item.lastSyncedAt).toLocaleString("en-CA")}
                    </span>
                  )}
                </p>
              </div>
              {(item.needsReauth || item.status === "error") && (
                <button
                  type="button"
                  onClick={() => void reconnect(item)}
                  disabled={busyId === item.id}
                  className="oc-btn-secondary px-3 py-2 text-xs"
                >
                  {busyId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Reconnect
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  );
}
