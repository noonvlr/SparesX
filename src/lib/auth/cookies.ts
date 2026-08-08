import type { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  AUTH_FLAG_COOKIE,
  CSRF_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/cookieNames";

export { AUTH_FLAG_COOKIE, CSRF_COOKIE, SESSION_COOKIE };

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

function publicCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
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
  res.cookies.set(CSRF_COOKIE, token, publicCookieOptions());
  return token;
}

export function clearCsrfCookie(res: NextResponse) {
  res.cookies.set(CSRF_COOKIE, "", {
    ...publicCookieOptions(0),
    maxAge: 0,
  });
  return res;
}

export function applyAuthFlagCookie(res: NextResponse) {
  res.cookies.set(AUTH_FLAG_COOKIE, "1", publicCookieOptions());
  return res;
}

export function clearAuthFlagCookie(res: NextResponse) {
  res.cookies.set(AUTH_FLAG_COOKIE, "", {
    ...publicCookieOptions(0),
    maxAge: 0,
  });
  return res;
}

/** Session + CSRF + auth flag (login / Google / password rotate). */
export function applyAuthCookies(res: NextResponse, token: string) {
  applySessionCookie(res, token);
  applyCsrfCookie(res);
  applyAuthFlagCookie(res);
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  clearSessionCookie(res);
  clearCsrfCookie(res);
  clearAuthFlagCookie(res);
  return res;
}
