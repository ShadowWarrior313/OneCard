import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "onecard_auth_session";

type SessionPayload = {
  email: string;
  exp: number;
};

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET ?? "dev_only_change_me";
}

export function createSessionToken(email: string, ttlSeconds = 60 * 60 * 24 * 30): string {
  const payload: SessionPayload = {
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = base64url(JSON.stringify(payload));
  const sig = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expected = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.email || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function readSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token)?.email ?? null;
}

export async function setSessionCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
