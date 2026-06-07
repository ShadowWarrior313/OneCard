import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { ensureHubUser, findHubUser } from "@/data/store";
import type { HubUser } from "@/data/schema";

/**
 * Per-user session for the hub. This is OneCard's own auth — it imports no
 * provider SDK and is independent of which bank-data provider is active. It
 * gates every internal hub route so a user only ever sees their own data
 * (per-user isolation).
 *
 * The Sandbox build derives a stable user id from the email; production must
 * replace this with a reviewed auth provider (see session route + README).
 */
const COOKIE_NAME = "onecard_hub_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  userId: string;
  expiresAt: number;
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "onecard-sandbox-session-secret";
  throw new Error("AUTH_SESSION_SECRET is required");
}

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", sessionSecret()).update(encodedPayload).digest("base64url");
}

function parseCookies(request: Request): Record<string, string> {
  return Object.fromEntries(
    (request.headers.get("cookie") ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function sessionToken(payload: SessionPayload): string {
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function readSession(request: Request): SessionPayload | undefined {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return undefined;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return undefined;
  const expected = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return undefined;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload : undefined;
  } catch {
    return undefined;
  }
}

export function userIdForEmail(email: string): string {
  return createHmac("sha256", sessionSecret())
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export async function createHubSession(input: {
  email: string;
  name: string;
}): Promise<{ user: HubUser; cookie: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2) {
    throw new Error("A valid name and email are required");
  }
  const user = await ensureHubUser({ id: userIdForEmail(email), email, name });
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(
      sessionToken({ userId: user.id, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 }),
    )}`,
    "Path=/",
    `Max-Age=${MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ].join("; ");
  return { user, cookie };
}

export function clearHubSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export async function requireHubUser(request: Request): Promise<HubUser | undefined> {
  const session = readSession(request);
  if (!session) return undefined;
  return findHubUser(session.userId);
}
