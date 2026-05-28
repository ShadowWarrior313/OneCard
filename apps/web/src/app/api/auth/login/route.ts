import { verifyPassword } from "@/lib/server/authCrypto";
import { setSessionCookie } from "@/lib/server/authSession";
import { getUserByEmail } from "@/lib/server/authStore";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return Response.json({ error: "Valid email is required" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const user = await getUserByEmail(email);
  if (!user) return Response.json({ error: "No account found for this email" }, { status: 404 });
  if (!user.verified) return Response.json({ error: "Please verify your email code first" }, { status: 403 });

  const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) return Response.json({ error: "Incorrect email or password" }, { status: 401 });

  await setSessionCookie(email);
  return Response.json({
    ok: true,
    user: { email: user.email, name: user.name, joinedAt: user.createdAt },
  });
}
