import "server-only";

import { createHash } from "node:crypto";
import { CountryCode, Products, type Transaction } from "plaid";
import type { FinancialDataProvider } from "../provider";
import type {
  LinkResult,
  LinkTokenResult,
  ProviderAccount,
  ProviderStatus,
  ProviderWebhookEvent,
  SyncResult,
} from "../types";
import { getPlaidClient } from "./client";
import { mapPlaidError, toProviderAccount, toProviderTransaction } from "./mapping";
import { verifyPlaidWebhook } from "./webhook";

const COUNTRY_CODES = [CountryCode.Ca, CountryCode.Us];
const MAX_SYNC_PAGES = 100;

/**
 * Plaid implementation of the neutral provider interface. Sandbox-first
 * (user_good / pass_good). Every Plaid call is funnelled through `mapPlaidError`
 * so the rest of the app only ever sees neutral `ProviderError`s with retry +
 * health-transition hints — never raw Plaid error shapes.
 */
export class PlaidProvider implements FinancialDataProvider {
  readonly id = "plaid" as const;

  async createLinkToken(input: { userId: string; webhookUrl?: string }): Promise<LinkTokenResult> {
    try {
      const response = await getPlaidClient().linkTokenCreate({
        client_name: "OneCard",
        country_codes: COUNTRY_CODES,
        language: "en",
        products: [Products.Transactions],
        user: { client_user_id: input.userId },
        ...(input.webhookUrl ? { webhook: input.webhookUrl } : {}),
      });
      return { provider: this.id, linkToken: response.data.link_token, mode: "create" };
    } catch (error) {
      throw mapPlaidError(error);
    }
  }

  async reauth(input: {
    userId: string;
    accessToken: string;
    webhookUrl?: string;
  }): Promise<LinkTokenResult> {
    try {
      // Update-mode Link: passing access_token (and no products) re-authenticates
      // the existing item rather than creating a new one.
      const response = await getPlaidClient().linkTokenCreate({
        client_name: "OneCard",
        country_codes: COUNTRY_CODES,
        language: "en",
        user: { client_user_id: input.userId },
        access_token: input.accessToken,
        ...(input.webhookUrl ? { webhook: input.webhookUrl } : {}),
      });
      return { provider: this.id, linkToken: response.data.link_token, mode: "update" };
    } catch (error) {
      throw mapPlaidError(error);
    }
  }

  async linkAccount(input: { publicToken: string }): Promise<LinkResult> {
    try {
      const client = getPlaidClient();
      const exchange = (await client.itemPublicTokenExchange({ public_token: input.publicToken }))
        .data;
      const accessToken = exchange.access_token;
      const accounts = (await client.accountsGet({ access_token: accessToken })).data.accounts;
      return {
        providerItemId: exchange.item_id,
        accessToken,
        institutionName: await this.institutionName(accessToken),
        accounts: accounts.map(toProviderAccount),
      };
    } catch (error) {
      throw mapPlaidError(error);
    }
  }

  async syncTransactions(input: { accessToken: string; cursor?: string }): Promise<SyncResult> {
    try {
      const client = getPlaidClient();
      const accounts = (await client.accountsGet({ access_token: input.accessToken })).data.accounts;

      let cursor = input.cursor;
      let hasMore = true;
      let page = 0;
      const added: Transaction[] = [];
      const modified: Transaction[] = [];
      const removedIds: string[] = [];

      while (hasMore && page < MAX_SYNC_PAGES) {
        const response = (
          await client.transactionsSync({
            access_token: input.accessToken,
            cursor,
            options: { include_personal_finance_category: true },
          })
        ).data;
        added.push(...response.added);
        modified.push(...response.modified);
        removedIds.push(...response.removed.map((removed) => removed.transaction_id));
        cursor = response.next_cursor;
        hasMore = response.has_more;
        page += 1;
      }
      if (hasMore) throw new Error("Plaid sync exceeded the page limit");

      return {
        accounts: accounts.map(toProviderAccount),
        added: added.map(toProviderTransaction),
        modified: modified.map(toProviderTransaction),
        removedIds,
        nextCursor: cursor,
      };
    } catch (error) {
      throw mapPlaidError(error);
    }
  }

  async getAccounts(input: { accessToken: string }): Promise<ProviderAccount[]> {
    try {
      const accounts = (await getPlaidClient().accountsGet({ access_token: input.accessToken }))
        .data.accounts;
      return accounts.map(toProviderAccount);
    } catch (error) {
      throw mapPlaidError(error);
    }
  }

  async status(input: { accessToken: string }): Promise<ProviderStatus> {
    try {
      const item = (await getPlaidClient().itemGet({ access_token: input.accessToken })).data.item;
      const errorCode = item.error?.error_code;
      return errorCode === "ITEM_LOGIN_REQUIRED"
        ? { status: "login_required", errorCode }
        : { status: "healthy", errorCode: errorCode ?? undefined };
    } catch (error) {
      const mapped = mapPlaidError(error);
      return { status: mapped.status, errorCode: mapped.code };
    }
  }

  async verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<ProviderWebhookEvent | null> {
    const signedJwt = headers["plaid-verification"];
    if (!signedJwt) return null;
    let valid = false;
    try {
      valid = await verifyPlaidWebhook(rawBody, signedJwt);
    } catch {
      return null;
    }
    if (!valid) return null;

    let body: {
      webhook_type?: string;
      webhook_code?: string;
      item_id?: string;
      error?: { error_code?: string };
    };
    try {
      body = JSON.parse(rawBody) as typeof body;
    } catch {
      return null;
    }

    // Idempotency key: Plaid retries resend an identical body, so hashing the
    // raw body gives a stable dedupe key without needing a provider event id.
    const id = createHash("sha256").update(rawBody).digest("hex");
    return {
      id,
      providerItemId: body.item_id,
      kind: classifyPlaidWebhook(body),
      errorCode: body.error?.error_code,
    };
  }

  /** Resolve a friendly institution name; falls back gracefully on any error. */
  private async institutionName(accessToken: string): Promise<string> {
    try {
      const client = getPlaidClient();
      const institutionId = (await client.itemGet({ access_token: accessToken })).data.item
        .institution_id;
      if (!institutionId) return "Linked institution";
      const institution = (
        await client.institutionsGetById({
          institution_id: institutionId,
          country_codes: COUNTRY_CODES,
        })
      ).data.institution;
      return institution.name || "Linked institution";
    } catch {
      return "Linked institution";
    }
  }
}

function classifyPlaidWebhook(body: {
  webhook_type?: string;
  webhook_code?: string;
  error?: { error_code?: string };
}): ProviderWebhookEvent["kind"] {
  if (body.webhook_type === "TRANSACTIONS" && body.webhook_code === "SYNC_UPDATES_AVAILABLE") {
    return "sync_available";
  }
  if (body.webhook_type === "ITEM") {
    if (body.webhook_code === "ERROR" && body.error?.error_code === "ITEM_LOGIN_REQUIRED") {
      return "login_required";
    }
    if (body.webhook_code === "PENDING_EXPIRATION") return "pending_expiration";
  }
  return "unknown";
}
