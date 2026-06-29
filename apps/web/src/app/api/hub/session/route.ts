import {
  clearHubSessionCookie,
  createHubSession,
  demoHubSessionsEnabled,
  requireHubUser,
} from "@/server/auth/session";
import { getHubServerConfig } from "@/config";

function demoSessionBridgeEnabled(): boolean {
  return getHubServerConfig().plaidEnv === "sandbox" && demoHubSessionsEnabled();
}

export async function GET(request: Request): Promise<Response> {
  const user = await requireHubUser(request);
  return user
    ? Response.json({ authenticated: true, user: { name: user.name, email: user.email } })
    : Response.json({ authenticated: false }, { status: 401 });
}

export async function POST(request: Request): Promise<Response> {
  if (!demoSessionBridgeEnabled()) {
    return Response.json(
      { error: "Demo profile login is only available in local sandbox builds" },
      { status: 501 },
    );
  }
  let body: { email?: string; name?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const { user, cookie } = await createHubSession({
      email: body.email ?? "",
      name: body.name ?? "",
    });
    return Response.json(
      { authenticated: true, user: { name: user.name, email: user.email } },
      { headers: { "Set-Cookie": cookie } },
    );
  } catch {
    return Response.json({ error: "A valid name and email are required" }, { status: 400 });
  }
}

export async function DELETE(): Promise<Response> {
  return Response.json(
    { authenticated: false },
    { headers: { "Set-Cookie": clearHubSessionCookie() } },
  );
}
