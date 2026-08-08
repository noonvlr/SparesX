import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_FLAG_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/cookieNames";

/**
 * Defense-in-depth for admin + technician + dashboard shells.
 * Requires a real session or refresh cookie — the readable `sparesx_auth`
 * flag alone is not enough (it is forgeable from the browser).
 * APIs still enforce requireAdmin / requireUser + role.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const gated =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/technician") ||
    pathname.startsWith("/dashboard");
  if (!gated) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  if (!session && !refresh) {
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    // Clear a forged soft-auth flag so the shell does not look "logged in"
    const res = NextResponse.redirect(login);
    if (req.cookies.get(AUTH_FLAG_COOKIE)?.value) {
      res.cookies.set(AUTH_FLAG_COOKIE, "", { path: "/", maxAge: 0 });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/technician/:path*", "/dashboard/:path*"],
};
