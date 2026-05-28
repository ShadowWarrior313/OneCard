import { hashVerificationCode } from "@/lib/server/authCrypto";
import { setSessionCookie } from "@/lib/server/authSession";
import { getUserByEmail, upsertUser } from "@/lib/server/authStore";

const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_LOCK_MS = 15 * 60 * 1000;

function futureTime(value: string | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

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
  if (futureTime(user.verificationLockedUntil) > Date.now()) {
    return Response.json({ error: "Too many verification attempts. Try again later." }, { status: 429 });
  }
  if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
    return Response.json({ error: "Verification code missing. Start signup again." }, { status: 400 });
  }
  if (new Date(user.verificationCodeExpiresAt).getTime() < Date.now()) {
    return Response.json({ error: "Verification code expired. Request a new code." }, { status: 410 });
  }

  const hashedCode = hashVerificationCode(code);
  if (hashedCode !== user.verificationCodeHash) {
    const failedAttempts = (user.verificationFailedAttempts ?? 0) + 1;
    const locked = failedAttempts >= MAX_VERIFICATION_ATTEMPTS;
    await upsertUser({
      ...user,
      verificationCodeHash: locked ? undefined : user.verificationCodeHash,
      verificationCodeExpiresAt: locked ? undefined : user.verificationCodeExpiresAt,
      verificationFailedAttempts: failedAttempts,
      verificationLockedUntil: locked
        ? new Date(Date.now() + VERIFICATION_LOCK_MS).toISOString()
        : undefined,
      updatedAt: new Date().toISOString(),
    });
    if (locked) {
      return Response.json({ error: "Too many verification attempts. Try again later." }, { status: 429 });
    }
    return Response.json({ error: "Incorrect verification code" }, { status: 401 });
  }

  await upsertUser({
    ...user,
    verified: true,
    verificationCodeHash: undefined,
    verificationCodeExpiresAt: undefined,
    verificationFailedAttempts: 0,
    verificationLockedUntil: undefined,
    updatedAt: new Date().toISOString(),
  });
  await setSessionCookie(email);

  return Response.json({
    ok: true,
    user: { email: user.email, name: user.name, joinedAt: user.createdAt },
  });
}
