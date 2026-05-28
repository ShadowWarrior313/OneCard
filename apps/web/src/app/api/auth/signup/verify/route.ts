import { hashVerificationCode } from "@/lib/server/authCrypto";
import { setSessionCookie } from "@/lib/server/authSession";
import { getUserByEmail, upsertUser } from "@/lib/server/authStore";

export async function POST(request: Request) {
  let body: { email?: string; code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const code = (body.code ?? "").trim();
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return Response.json({ error: "Valid email is required" }, { status: 400 });
  if (!code.match(/^\d{6}$/)) return Response.json({ error: "Enter the 6-digit code" }, { status: 400 });

  const user = await getUserByEmail(email);
  if (!user) return Response.json({ error: "No signup request found for this email" }, { status: 404 });
  if (user.verified) return Response.json({ error: "Account already verified. Log in instead." }, { status: 409 });
  if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
    return Response.json({ error: "Verification code missing. Start signup again." }, { status: 400 });
  }
  if (new Date(user.verificationCodeExpiresAt).getTime() < Date.now()) {
    return Response.json({ error: "Verification code expired. Request a new code." }, { status: 410 });
  }

  const hashedCode = hashVerificationCode(code);
  if (hashedCode !== user.verificationCodeHash) {
    return Response.json({ error: "Incorrect verification code" }, { status: 401 });
  }

  await upsertUser({
    ...user,
    verified: true,
    verificationCodeHash: undefined,
    verificationCodeExpiresAt: undefined,
    updatedAt: new Date().toISOString(),
  });
  await setSessionCookie(email);

  return Response.json({
    ok: true,
    user: { email: user.email, name: user.name, joinedAt: user.createdAt },
  });
}
