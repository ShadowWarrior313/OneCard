import "server-only";

/**
 * Server config for the rewards-intelligence hub. Provider-neutral where it can
 * be: `plaidEnv` only matters to the Plaid implementation, but `webhookUrl` is
 * generic (any provider posts to `/api/hub/webhook/<provider>`).
 */
export type PlaidEnvironment = "sandbox" | "development" | "production";

export interface HubServerConfig {
  plaidEnv: PlaidEnvironment;
  /** Explicit local-only opt-in for the email-to-session Sandbox bridge. */
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
      process.env.HUB_SANDBOX_EMAIL_AUTH === "1" && process.env.NODE_ENV !== "production",
    webhookUrl: webhook?.startsWith("https://") ? webhook : undefined,
  };
}
