import "server-only";

/**
 * Server config for the rewards-intelligence hub. Provider-neutral where it can
 * be: `plaidEnv` only matters to the Plaid implementation, but `webhookUrl` is
 * generic (any provider posts to `/api/hub/webhook/<provider>`).
 */
export type PlaidEnvironment = "sandbox" | "development" | "production";

export interface HubServerConfig {
  plaidEnv: PlaidEnvironment;
  /** Public HTTPS endpoint a provider should call back, if configured. */
  webhookUrl?: string;
}

export function getHubServerConfig(): HubServerConfig {
  const configuredPlaidEnv = process.env.PLAID_ENV?.trim();
  if (!configuredPlaidEnv && process.env.NODE_ENV === "production") {
    throw new Error("PLAID_ENV is required when hub APIs run in production");
  }
  const plaidEnv = (configuredPlaidEnv || "sandbox") as PlaidEnvironment;
  if (!["sandbox", "development", "production"].includes(plaidEnv)) {
    throw new Error("PLAID_ENV must be sandbox, development, or production");
  }
  const webhook = (process.env.HUB_WEBHOOK_URL ?? process.env.PLAID_WEBHOOK_URL)?.trim();
  return {
    plaidEnv,
    webhookUrl: webhook?.startsWith("https://") ? webhook : undefined,
  };
}
