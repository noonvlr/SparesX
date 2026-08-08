import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { getTokenFromRequest } from "@/lib/auth/getTokenFromRequest";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { bumpSessionVersion } from "@/lib/auth/sessionVersion";

/**
 * POST /api/auth/logout — invalidate JWTs (best-effort) and clear session cookie.
 * Client should still clear localStorage token.
 */
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (token) {
    const payload = verifyJwt(token);
    if (payload?.id) {
      try {
        await bumpSessionVersion(payload.id);
      } catch {
        // still return ok so client logout proceeds
      }
    }
  }
  const res = NextResponse.json({ ok: true }, { status: 200 });
  clearSessionCookie(res);
  return res;
}
