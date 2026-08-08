import type { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/** HttpOnly session cookie — Phase 11 dual-mode (Bearer JSON token still issued). */
export const SESSION_COOKIE = "sparesx_session";

/** Readable CSRF double-submit cookie (not HttpOnly). */
export const CSRF_COOKIE = "sparesx_csrf";

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

function csrfCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: false,
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

export function applyCsrfCookie(res: NextResponse) {
  const token = randomBytes(32).toString("hex");
  res.cookies.set(CSRF_COOKIE, token, csrfCookieOptions());
  return token;
}

export function clearCsrfCookie(res: NextResponse) {
  res.cookies.set(CSRF_COOKIE, "", {
    ...csrfCookieOptions(0),
    maxAge: 0,
  });
  return res;
}

/** Session + CSRF cookies together (login / Google / password rotate). */
export function applyAuthCookies(res: NextResponse, token: string) {
  applySessionCookie(res, token);
  applyCsrfCookie(res);
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  clearSessionCookie(res);
  clearCsrfCookie(res);
  return res;
}
