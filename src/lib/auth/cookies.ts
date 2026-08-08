import type { NextResponse } from "next/server";

/** HttpOnly session cookie — Phase 11 dual-mode (Bearer JSON token still issued). */
export const SESSION_COOKIE = "sparesx_session";

/** Match JWT expiry (7 days). */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function applySessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
