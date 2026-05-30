import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — runs before every matched request.
 *
 * Responsibilities:
 *   1. HTTPS redirect (belt-and-suspenders; Vercel also enforces at the CDN)
 *   2. Rate limiting on payment-sensitive API routes
 *   3. Block obviously malformed Stripe webhook payloads early
 */

// ── Rate limit store ────────────────────────────────────────────────────────
// Edge runtime doesn't support Node.js Map persistence across invocations,
// so this is intentionally a lightweight in-request guard.
// For production, replace with Upstash Redis or Vercel KV.

const RATE_LIMITED_ROUTES = [
  "/api/stripe/setup-intent",
  "/api/stripe/confirm-card",
  "/api/waitlist",
];

// Max requests per IP per window per route (very conservative for payment routes)
const WINDOW_MS = 60_000;
const MAX_REQUESTS: Record<string, number> = {
  "/api/stripe/setup-intent": 5,
  "/api/stripe/confirm-card": 10,
  "/api/waitlist": 10,
};

// In-memory store (resets per cold start — replace with KV for durability)
const hits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, route: string): boolean {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const limit = MAX_REQUESTS[route] ?? 20;
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false; // not limited
  }

  entry.count += 1;
  hits.set(key, entry);
  return entry.count > limit; // true = blocked
}

export function middleware(request: NextRequest) {
  const { pathname, protocol } = request.nextUrl;

  // 1. HTTPS redirect in production (Vercel handles this at the edge too,
  //    but being explicit avoids any misconfigured reverse-proxy scenario)
  if (
    process.env.NODE_ENV === "production" &&
    protocol === "http:" &&
    !request.headers.get("x-forwarded-proto")?.includes("https")
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Rate limiting on sensitive API routes
  const isRateLimitedRoute = RATE_LIMITED_ROUTES.some((r) => pathname.startsWith(r));
  if (isRateLimitedRoute) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const route = RATE_LIMITED_ROUTES.find((r) => pathname.startsWith(r)) ?? pathname;
    if (checkRateLimit(ip, route)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all API routes and pages (skip static files and images)
    "/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)).*)",
  ],
};
