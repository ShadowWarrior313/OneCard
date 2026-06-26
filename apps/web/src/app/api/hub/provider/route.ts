import { resolveProviderId } from "@/server/data-providers";
import { requireHubUser } from "@/server/auth/session";
import { hubDisabledResponse, isHubApiEnabled } from "@/server/hub/access";

/** GET /api/hub/provider — which data provider is active (drives the link UI). */
export async function GET(request: Request): Promise<Response> {
  if (!isHubApiEnabled()) return hubDisabledResponse();
  const user = await requireHubUser(request);
  if (!user) return Response.json({ error: "Log in" }, { status: 401 });
  return Response.json({ provider: resolveProviderId() });
}
