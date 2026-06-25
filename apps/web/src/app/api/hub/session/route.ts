import { clearHubSessionCookie, createHubSession, requireHubUser } from "@/server/auth/session";
import { getHubServerConfig } from "@/config";

const LOCAL_SANDBOX_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function requestHostname(request: Request): string | undefined {
  try {
    return new URL(request.url).hostname.toLowerCase();
  } catch {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const firstHost = host?.split(",")[0]?.trim().toLowerCase();
    if (!firstHost) return undefined;
    if (firstHost.startsWith("[")) return firstHost.slice(1, firstHost.indexOf("]"));
    return firstHost.split(":")[0];
  }
}

function isLocalSandboxRequest(request: Request): boolean {
  const hostname = requestHostname(request);
  return Boolean(hostname && LOCAL_SANDBOX_HOSTS.has(hostname));
}

export async function GET(request: Request): Promise<Response> {
  const user = await requireHubUser(request);
  return user
    ? Response.json({ authenticated: true, user: { name: user.name, email: user.email } })
    : Response.json({ authenticated: false }, { status: 401 });
}

export async function POST(request: Request): Promise<Response> {
  if (getHubServerConfig().plaidEnv !== "sandbox") {
    return Response.json(
      { error: "Development and production require a verified authentication provider" },
      { status: 501 },
    );
  }
  if (!isLocalSandboxRequest(request)) {
    return Response.json(
      { error: "Sandbox profile sessions are only available on localhost" },
      { status: 403 },
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
