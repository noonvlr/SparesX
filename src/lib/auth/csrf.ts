import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { CSRF_COOKIE, SESSION_COOKIE } from "@/lib/auth/cookieNames";
import { SITE_URL } from "@/lib/seo/site";

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

/** True when Authorization Bearer is present (not a classic CSRF vector). */
export function hasBearerAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  return Boolean(
    authHeader?.startsWith("Bearer ") && authHeader.slice(7).trim(),
  );
}

function originAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    const referer = req.headers.get("referer");
    if (!referer) return true;
    try {
      const refHost = new URL(referer).host;
      const siteHost = new URL(SITE_URL).host;
      const reqHost = req.headers.get("host") || "";
      return refHost === siteHost || refHost === reqHost;
    } catch {
      return false;
    }
  }
  try {
    const originHost = new URL(origin).host;
    const siteHost = new URL(SITE_URL).host;
    const reqHost = req.headers.get("host") || "";
    if (originHost === siteHost || originHost === reqHost) return true;
    if (
      process.env.NODE_ENV !== "production" &&
      (originHost.startsWith("localhost") ||
        originHost.startsWith("127.0.0.1"))
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Cookie-authenticated mutating requests must send matching X-CSRF-Token.
 * Bearer-authenticated requests skip (token already in localStorage).
 */
export function assertCsrfForCookieMutation(
  req: NextRequest,
): NextResponse | null {
  if (isSafeMethod(req.method.toUpperCase())) return null;
  if (hasBearerAuth(req)) return null;

  const session = req.cookies.get(SESSION_COOKIE)?.value?.trim();
  if (!session) return null;

  if (!originAllowed(req)) {
    return NextResponse.json(
      { message: "Invalid request origin" },
      { status: 403 },
    );
  }

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value?.trim() || "";
  const headerToken = req.headers.get("x-csrf-token")?.trim() || "";
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return NextResponse.json(
      { message: "Invalid CSRF token" },
      { status: 403 },
    );
  }
  return null;
}
