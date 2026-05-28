import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "onecard_auth_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = pathname.startsWith("/wallet");
  if (!requiresAuth) return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/wallet/:path*"],
};
