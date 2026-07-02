import "server-only";

/**
 * Server config for the rewards-intelligence hub. Provider-neutral where it can
 * be: `plaidEnv` only matters to the Plaid implementation, but `webhookUrl` is
 * generic (any provider posts to `/api/hub/webhook/<provider>`).
 */
export type PlaidEnvironment = "sandbox" | "development" | "production";

export interface HubServerConfig {
  plaidEnv: PlaidEnvironment;
  /**
   * Enables the email-only sandbox session bridge for local/mock demos.
   * This is never enabled in production because knowing an email must not be
   * enough to claim that user's hub data.
   */
  sandboxEmailAuthEnabled: boolean;
  /** Public HTTPS endpoint a provider should call back, if configured. */
  webhookUrl?: string;
}

export function getHubServerConfig(): HubServerConfig {
  const plaidEnv = (process.env.PLAID_ENV?.trim() || "sandbox") as PlaidEnvironment;
  if (!["sandbox", "development", "production"].includes(plaidEnv)) {
    throw new Error("PLAID_ENV must be sandbox, development, or production");
  }
  const webhook = (process.env.HUB_WEBHOOK_URL ?? process.env.PLAID_WEBHOOK_URL)?.trim();
  return {
    plaidEnv,
    sandboxEmailAuthEnabled:
      process.env.NODE_ENV !== "production" && process.env.HUB_SANDBOX_EMAIL_AUTH === "1",
    webhookUrl: webhook?.startsWith("https://") ? webhook : undefined,
  };
}
