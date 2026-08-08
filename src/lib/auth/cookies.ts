import type { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  AUTH_FLAG_COOKIE,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/cookieNames";

export {
  AUTH_FLAG_COOKIE,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
};

/** Short-lived access JWT in session cookie. */
export const ACCESS_MAX_AGE_SEC = 60 * 60;
/** Refresh token / auth-flag lifetime. */
export const REFRESH_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/** @deprecated Prefer ACCESS_MAX_AGE_SEC / REFRESH_MAX_AGE_SEC */
export const SESSION_MAX_AGE_SEC = REFRESH_MAX_AGE_SEC;

export function sessionCookieOptions(maxAge = ACCESS_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function publicCookieOptions(maxAge = REFRESH_MAX_AGE_SEC) {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function refreshCookieOptions(maxAge = REFRESH_MAX_AGE_SEC) {
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

export function applyRefreshCookie(res: NextResponse, rawToken: string) {
  res.cookies.set(REFRESH_COOKIE, rawToken, refreshCookieOptions());
  return res;
}

export function clearRefreshCookie(res: NextResponse) {
  res.cookies.set(REFRESH_COOKIE, "", {
    ...refreshCookieOptions(0),
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

/** Session + CSRF + auth flag + optional refresh (login / Google / password rotate). */
export async function applyAuthCookies(
  res: NextResponse,
  accessToken: string,
  opts?: { userId?: string; userAgent?: string | null; refreshRaw?: string },
) {
  applySessionCookie(res, accessToken);
  applyCsrfCookie(res);
  applyAuthFlagCookie(res);

  let refreshRaw = opts?.refreshRaw;
  if (!refreshRaw && opts?.userId) {
    const { issueRefreshToken } = await import("@/lib/auth/refreshTokens");
    refreshRaw = await issueRefreshToken({
      userId: opts.userId,
      userAgent: opts.userAgent,
    });
  }
  if (refreshRaw) {
    applyRefreshCookie(res, refreshRaw);
  }
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  clearSessionCookie(res);
  clearCsrfCookie(res);
  clearAuthFlagCookie(res);
  clearRefreshCookie(res);
  return res;
}
