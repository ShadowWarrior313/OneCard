import { dashboardForUser } from "@/data/store";
import { requireHubUser } from "@/server/auth/session";
import { hubDisabledResponse, isHubApiEnabled } from "@/server/hub/access";

export async function GET(request: Request): Promise<Response> {
  if (!isHubApiEnabled()) return hubDisabledResponse();
  const user = await requireHubUser(request);
  if (!user) return Response.json({ error: "Log in to view your hub" }, { status: 401 });
  return Response.json(await dashboardForUser(user.id));
}
