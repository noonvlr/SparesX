import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

/**
 * Prefer Authorization Bearer, fall back to HttpOnly session cookie.
 * Dual-mode foundation for Phase 11 — clients may still send Bearer.
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookie = req.cookies.get(SESSION_COOKIE)?.value?.trim();
  return cookie || null;
}
