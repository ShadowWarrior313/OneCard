import "server-only";

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { getHubServerConfig } from "@/config";

/**
 * The single Plaid SDK client. This file (and its siblings in this folder) are
 * the ONLY modules in the app allowed to import `plaid`. Everything above the
 * provider boundary speaks the neutral `FinancialDataProvider` interface.
 */
export class PlaidConfigurationError extends Error {}

function plaidEnvironment(): string {
  const env = getHubServerConfig().plaidEnv;
  if (env === "sandbox") return PlaidEnvironments.sandbox;
  if (env === "development") return "https://development.plaid.com";
  if (env === "production") return PlaidEnvironments.production;
  throw new PlaidConfigurationError("PLAID_ENV must be sandbox, development, or production");
}

let client: PlaidApi | undefined;

export function getPlaidClient(): PlaidApi {
  if (client) return client;
  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !secret) {
    throw new PlaidConfigurationError("Plaid is not configured");
  }
  client = new PlaidApi(
    new Configuration({
      basePath: plaidEnvironment(),
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": clientId,
          "PLAID-SECRET": secret,
          "Plaid-Version": "2020-09-14",
        },
      },
    }),
  );
  return client;
}
