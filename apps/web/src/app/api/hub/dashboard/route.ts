import { dashboardForUser } from "@/data/store";
import { requireHubUser } from "@/server/auth/session";

export async function GET(request: Request): Promise<Response> {
  const user = await requireHubUser(request);
  if (!user) return Response.json({ error: "Log in to view your hub" }, { status: 401 });
  return Response.json(await dashboardForUser(user.id));
}
