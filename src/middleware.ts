import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_FLAG_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/cookieNames";

/**
 * Defense-in-depth for admin shells. APIs still enforce requireAdmin.
 * Cookie presence only (Edge-safe) — role checks remain in AdminGate / APIs.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const flag = req.cookies.get(AUTH_FLAG_COOKIE)?.value;

  if (!session && !refresh && flag !== "1") {
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
