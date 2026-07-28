import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { FinancialDataProvider } from "../provider";
import { ProviderError } from "../provider";
import type {
  LinkResult,
  LinkTokenResult,
  ProviderAccount,
  ProviderStatus,
  ProviderWebhookEvent,
  SyncResult,
} from "../types";
import { MOCK_ACCOUNTS, MOCK_INSTITUTION, mockTransactions } from "./fixtures";
import { mockProviderItemId } from "./ids";

/**
 * Fully local provider. Default in dev/test so the hub works with NO Plaid keys.
 *
 * It also lets us exercise the reliability layer deterministically:
 *  - a public token containing "login-required" produces an item that reports
 *    `login_required` on its next sync (the re-auth path),
 *  - a public token containing "rate-limit" makes the first sync throw a
 *    retryable rate-limit error (the backoff path).
 *
 * The access token is a self-describing opaque string. It carries NO secret —
 * it only encodes which test scenario the linked item is in.
 */

type Scenario = "healthy" | "login_required" | "rate_limit";

function scenarioFromPublicToken(publicToken: string): Scenario {
  if (publicToken.includes("login-required")) return "login_required";
  if (publicToken.includes("rate-limit")) return "rate_limit";
  return "healthy";
}

function accessTokenFor(scenario: Scenario): string {
  return `mock-access-${scenario}`;
}

function scenarioFromAccessToken(accessToken: string): Scenario {
  if (accessToken.endsWith("login_required")) return "login_required";
  if (accessToken.endsWith("rate_limit")) return "rate_limit";
  return "healthy";
}

/** Fail closed: never ship a published default HMAC secret. */
function mockWebhookSecret(): string | null {
  const secret = process.env.MOCK_WEBHOOK_SECRET?.trim();
  return secret ? secret : null;
}

/** Per-token attempt counter so the rate-limit scenario fails once then recovers. */
const rateLimitAttempts = new Map<string, number>();

export class MockProvider implements FinancialDataProvider {
  readonly id = "mock" as const;

  async createLinkToken(): Promise<LinkTokenResult> {
    // No client widget needed — the UI links directly via linkAccount().
    return { provider: this.id, mode: "create" };
  }

  async reauth(): Promise<LinkTokenResult> {
    return { provider: this.id, mode: "update" };
  }

  async linkAccount(input: { publicToken: string; userId: string }): Promise<LinkResult> {
    const scenario = scenarioFromPublicToken(input.publicToken);
    return {
      // Stable per-user id (scenario-independent) so re-linking REPAIRS the same
      // item for that user — and webhooks cannot collide across hub users.
      providerItemId: mockProviderItemId(input.userId),
      accessToken: accessTokenFor(scenario),
      institutionName: MOCK_INSTITUTION,
      accounts: MOCK_ACCOUNTS,
    };
  }

  async syncTransactions(input: { accessToken: string; cursor?: string }): Promise<SyncResult> {
    const scenario = scenarioFromAccessToken(input.accessToken);

    if (scenario === "login_required") {
      throw new ProviderError({
        message: "Mock item requires re-authentication",
        code: "login_required",
        status: "login_required",
      });
    }
    if (scenario === "rate_limit") {
      // Fail the first attempt only, so the orchestration's backoff recovers it.
      const attempts = (rateLimitAttempts.get(input.accessToken) ?? 0) + 1;
      rateLimitAttempts.set(input.accessToken, attempts);
      if (attempts === 1) {
        throw new ProviderError({
          message: "Mock institution rate limit",
          code: "rate_limit",
          retryable: true,
          retryAfterMs: 200,
          status: "healthy",
        });
      }
    }

    // Cursor present => we've already delivered the batch; nothing new.
    if (input.cursor) {
      return { accounts: MOCK_ACCOUNTS, added: [], modified: [], removedIds: [], nextCursor: input.cursor };
    }
    return {
      accounts: MOCK_ACCOUNTS,
      added: mockTransactions(),
      modified: [],
      removedIds: [],
      nextCursor: "mock-cursor-1",
    };
  }

  async getAccounts(): Promise<ProviderAccount[]> {
    return MOCK_ACCOUNTS;
  }

  async status(input: { accessToken: string }): Promise<ProviderStatus> {
    const scenario = scenarioFromAccessToken(input.accessToken);
    return scenario === "login_required"
      ? { status: "login_required", errorCode: "ITEM_LOGIN_REQUIRED" }
      : { status: "healthy" };
  }

  async verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<ProviderWebhookEvent | null> {
    const secret = mockWebhookSecret();
    if (!secret) return null;
    const signature = headers["x-mock-signature"];
    if (!signature) return null;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    let body: { id?: string; itemId?: string; kind?: ProviderWebhookEvent["kind"] };
    try {
      body = JSON.parse(rawBody) as typeof body;
    } catch {
      return null;
    }
    return {
      id: body.id ?? `mock_${expected.slice(0, 16)}`,
      providerItemId: body.itemId,
      kind: body.kind ?? "sync_available",
    };
  }
}
