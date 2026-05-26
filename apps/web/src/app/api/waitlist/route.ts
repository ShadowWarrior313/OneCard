import { normalizeProfileName } from "@/lib/userProfile";

export async function POST(request: Request) {
  let body: { name?: string; email?: string };
  try {
    body = (await request.json()) as { name?: string; email?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = normalizeProfileName(body.name ?? "");
  const email = body.email?.trim().toLowerCase() ?? "";

  if (name.length < 2) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }

  return Response.json({
    ok: true,
    name,
    email,
  });
}
