import "server-only";

/**
 * Hub APIs are server-side gated separately from the public UI flag. This keeps
 * route handlers dark in deployed environments unless backend persistence,
 * provider credentials, and auth have all been deliberately configured.
 */
export function isHubApiEnabled(): boolean {
  return process.env.HUB_API_ENABLED === "1";
}

export function hubDisabledResponse(): Response {
  return Response.json({ error: "Rewards hub is not enabled" }, { status: 404 });
}

export function isSandboxHubSessionEnabled(): boolean {
  return process.env.HUB_DEMO_AUTH_ENABLED === "1";
}
