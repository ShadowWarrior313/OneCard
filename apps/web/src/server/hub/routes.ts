import "server-only";

import { getDataProvider } from "@/server/data-providers";
import { ProviderNotConfiguredError } from "@/server/data-providers/provider";
import { getHubServerConfig } from "@/config";
import { requireHubUser } from "@/server/auth/session";
import {
  dashboardForUser,
  findItemByProviderItemId,
  hasWebhookReceipt,
  recordWebhookOnce,
  setItemStatus,
} from "@/data/store";
import { logProviderWarning } from "@/server/log";
import { accessTokenForUserItem, linkAndSync, syncLinkedItem, syncUserItems } from "./ingest";

/**
 * Internal, authenticated hub routes — provider-neutral. None of these import a
 * provider SDK; they speak only the `FinancialDataProvider` interface via
 * `getDataProvider()`. The webhook route is signature-authenticated (not session
 * authenticated) because the provider, not the user, calls it.
 */
function error(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function providerFailure(cause: unknown, fallback: string): Response {
  return cause instanceof ProviderNotConfiguredError
    ? error("The data provider is not configured", 503)
    : error(fallback, 502);
}

/** POST /api/hub/link-token — start (or, in update mode, resume) a connection. */
export async function createLinkToken(request: Request): Promise<Response> {
  const user = await requireHubUser(request);
  if (!user) return error("Log in to link an account", 401);
  try {
    const result = await getDataProvider().createLinkToken({
      userId: user.id,
      webhookUrl: getHubServerConfig().webhookUrl,
    });
    return Response.json(result);
  } catch (cause) {
    return providerFailure(cause, "Could not start account linking");
  }
}

/** POST /api/hub/link-exchange — exchange a public token, persist, initial sync. */
export async function exchangePublicToken(request: Request): Promise<Response> {
  const user = await requireHubUser(request);
  if (!user) return error("Log in to link an account", 401);
  let publicToken = "";
  try {
    publicToken = ((await request.json()) as { publicToken?: string }).publicToken?.trim() ?? "";
  } catch {
    return error("Invalid request body", 400);
  }
  if (!publicToken || publicToken.length > 1024) return error("Invalid public token", 400);

  try {
    await linkAndSync({ userId: user.id, publicToken });
    return Response.json(await dashboardForUser(user.id));
  } catch (cause) {
    return providerFailure(cause, "Could not import this account");
  }
}

/** POST /api/hub/sync — incremental refresh of every linked item for the user. */
export async function syncTransactions(request: Request): Promise<Response> {
  const user = await requireHubUser(request);
  if (!user) return error("Log in to refresh transactions", 401);
  await syncUserItems(user.id);
  return Response.json(await dashboardForUser(user.id));
}

/** POST /api/hub/reauth — produce an update-mode link handshake for one item. */
export async function reauth(request: Request): Promise<Response> {
  const user = await requireHubUser(request);
  if (!user) return error("Log in to reconnect an account", 401);
  let itemId = "";
  try {
    itemId = ((await request.json()) as { itemId?: string }).itemId?.trim() ?? "";
  } catch {
    return error("Invalid request body", 400);
  }
  const accessToken = await accessTokenForUserItem(user.id, itemId);
  if (!accessToken) return error("Account not found", 404);

  try {
    const result = await getDataProvider().reauth({
      userId: user.id,
      accessToken,
      webhookUrl: getHubServerConfig().webhookUrl,
    });
    return Response.json(result);
  } catch (cause) {
    return providerFailure(cause, "Could not start reconnect");
  }
}

/**
 * POST /api/hub/webhook/[provider] — verified, idempotent provider webhook.
 *
 * Drives sync refreshes and connection-health transitions. Replays are no-ops
 * (idempotency ledger). Invalid signatures are rejected. No session required —
 * trust comes from the signature, not a cookie.
 */
export async function handleWebhook(request: Request, providerParam: string): Promise<Response> {
  const provider = getDataProvider();
  if (providerParam !== provider.id) return error("Unknown provider", 404);

  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  let event;
  try {
    event = await provider.verifyAndParseWebhook(rawBody, headers);
  } catch {
    return error("Could not verify webhook", 400);
  }
  if (!event) return error("Invalid webhook signature", 400);

  // Idempotency: skip verified webhooks only after a prior successful handling.
  // sync_available is intentionally excluded from durable receipts — Plaid may
  // send identical bodies for distinct later updates, and cursor-based sync is
  // already idempotent.
  if (event.kind !== "sync_available" && (await hasWebhookReceipt(event.id))) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    if (event.kind === "sync_available" && event.providerItemId) {
      const item = await findItemByProviderItemId(event.providerItemId);
      if (item) await syncLinkedItem(item.id, { throwOnFailure: true });
    } else if (event.providerItemId && event.kind === "login_required") {
      logProviderWarning("Webhook flagged item login_required", event.errorCode);
      await setItemStatus(event.providerItemId, "login_required", event.errorCode);
    } else if (event.providerItemId && event.kind === "pending_expiration") {
      // Surface reconnect proactively before the credential fully expires.
      await setItemStatus(event.providerItemId, "login_required", event.errorCode);
    } else if (event.providerItemId && event.kind === "error") {
      await setItemStatus(event.providerItemId, "error", event.errorCode);
    }
  } catch {
    logProviderWarning("Webhook processing failed; provider should retry", "webhook_processing_failed");
    return error("Could not process webhook", 503);
  }

  if (event.kind !== "sync_available" && !(await recordWebhookOnce(event.id))) {
    return Response.json({ received: true, duplicate: true });
  }

  return Response.json({ received: true });
}
