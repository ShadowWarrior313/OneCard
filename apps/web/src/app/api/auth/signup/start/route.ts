import { normalizeProfileName } from "@/lib/userProfile";
import { generateVerificationCode, hashPassword, hashVerificationCode } from "@/lib/server/authCrypto";
import { sendVerificationCodeEmail } from "@/lib/server/authEmail";
import { getUserByEmail, upsertUser } from "@/lib/server/authStore";

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = normalizeProfileName(body.name ?? "");
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (name.length < 2) return Response.json({ error: "Full name is required" }, { status: 400 });
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return Response.json({ error: "Valid email is required" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (password !== confirmPassword) return Response.json({ error: "Passwords do not match" }, { status: 400 });

  const existing = await getUserByEmail(email);
  if (existing?.verified) {
    return Response.json({ error: "Account already exists. Log in instead." }, { status: 409 });
  }

  const code = generateVerificationCode();
  const { salt, hash } = await hashPassword(password);
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await upsertUser({
    email,
    name,
    passwordSalt: salt,
    passwordHash: hash,
    verified: false,
    verificationCodeHash: hashVerificationCode(code),
    verificationCodeExpiresAt: expires,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  const sent = await sendVerificationCodeEmail({ email, name, code });

  return Response.json({
    ok: true,
    email,
    verificationRequired: true,
    delivery: sent.mode,
    deliveryReason: sent.reason,
  });
}
