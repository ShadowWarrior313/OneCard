"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, Loader2, PlugZap } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import type { HubDashboardData } from "@/data/schema";
import type { ProviderId } from "@/server/data-providers/types";

/**
 * Provider-aware "link an account" control.
 *
 * It never imports a provider SDK on the server side — it only consumes the
 * neutral hub routes. For Plaid it runs the Plaid Link widget; for the mock
 * provider (the default) it links directly with no third-party widget, so the
 * hub is demoable end-to-end with zero Plaid keys.
 */
async function exchange(publicToken: string): Promise<HubDashboardData> {
  const response = await fetch("/api/hub/link-exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicToken }),
  });
  const body = (await response.json()) as HubDashboardData & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Could not import this account");
  return body;
}

export function LinkAccountButton({
  provider,
  onImported,
}: {
  provider: ProviderId;
  onImported: (data: HubDashboardData) => void;
}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [launchWhenReady, setLaunchWhenReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setBusy(true);
      setError("");
      try {
        onImported(await exchange(publicToken));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not import this account");
      } finally {
        setBusy(false);
        setLinkToken(null);
      }
    },
    [onImported],
  );

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess });

  useEffect(() => {
    if (launchWhenReady && ready) {
      setLaunchWhenReady(false);
      open();
    }
  }, [launchWhenReady, open, ready]);

  // For the mock provider, link directly with a chosen scenario token.
  const linkMock = useCallback(
    async (publicToken: string) => {
      setBusy(true);
      setError("");
      try {
        onImported(await exchange(publicToken));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not import this account");
      } finally {
        setBusy(false);
      }
    },
    [onImported],
  );

  async function launch() {
    if (linkToken && ready) {
      open();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/hub/link-token", { method: "POST" });
      const body = (await response.json()) as { provider?: ProviderId; linkToken?: string; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not start account linking");

      if (body.provider !== "plaid" || !body.linkToken) {
        // Mock provider (or any provider without a browser widget): link directly.
        await linkMock("mock-healthy");
        return;
      }
      setLinkToken(body.linkToken);
      setLaunchWhenReady(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start account linking");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={launch} disabled={busy} className="oc-btn-primary px-4 py-2.5">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
        {provider === "plaid" ? "Link a bank in Sandbox" : "Link a sample account"}
      </button>

      {provider === "mock" && (
        // Reliability demo: link a sample account that will report
        // ITEM_LOGIN_REQUIRED, so the reconnect path can be exercised in the UI.
        <button
          type="button"
          onClick={() => void linkMock("mock-login-required")}
          disabled={busy}
          className="oc-btn-secondary ml-2 px-3 py-2.5 text-xs"
          title="Links a sample account that needs reconnecting, to demo the reliability layer"
        >
          <PlugZap className="h-3.5 w-3.5" /> Link a reconnect-needed sample
        </button>
      )}

      {error && <p className="mt-2 max-w-md text-xs text-red-700">{error}</p>}
    </div>
  );
}
