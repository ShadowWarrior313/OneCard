import { resolveProviderId } from "@/server/data-providers";
import { requireHubUser } from "@/server/auth/session";

/** GET /api/hub/provider — which data provider is active (drives the link UI). */
export async function GET(request: Request): Promise<Response> {
  const user = await requireHubUser(request);
  if (!user) return Response.json({ error: "Log in" }, { status: 401 });
  return Response.json({ provider: resolveProviderId() });
}
