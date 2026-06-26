import { clearHubSessionCookie, createHubSession, requireHubUser } from "@/server/auth/session";
import { getHubServerConfig } from "@/config";
import {
  hubDisabledResponse,
  isHubApiEnabled,
  isSandboxHubSessionEnabled,
} from "@/server/hub/access";

export async function GET(request: Request): Promise<Response> {
  if (!isHubApiEnabled()) return hubDisabledResponse();
  const user = await requireHubUser(request);
  return user
    ? Response.json({ authenticated: true, user: { name: user.name, email: user.email } })
    : Response.json({ authenticated: false }, { status: 401 });
}

export async function POST(request: Request): Promise<Response> {
  if (!isHubApiEnabled()) return hubDisabledResponse();
  if (getHubServerConfig().plaidEnv !== "sandbox" || !isSandboxHubSessionEnabled()) {
    return Response.json(
      { error: "Sandbox hub sessions require explicit server-side opt-in" },
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
  if (!isHubApiEnabled()) return hubDisabledResponse();
  return Response.json(
    { authenticated: false },
    { headers: { "Set-Cookie": clearHubSessionCookie() } },
  );
}
