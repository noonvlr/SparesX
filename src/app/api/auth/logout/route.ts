import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { getTokenFromRequest } from "@/lib/auth/getTokenFromRequest";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { bumpSessionVersion } from "@/lib/auth/sessionVersion";
import {
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
} from "@/lib/auth/refreshTokens";
import { assertCsrfForCookieMutation } from "@/lib/auth/csrf";

/**
 * POST /api/auth/logout — invalidate session + refresh tokens and clear cookies.
 * Requires CSRF when a session cookie is present (cookie-auth logout).
 */
export async function POST(req: NextRequest) {
  const csrfError = assertCsrfForCookieMutation(req);
  if (csrfError) return csrfError;

  const token = getTokenFromRequest(req);
  if (token) {
    const payload = verifyJwt(token);
    if (payload?.id) {
      try {
        await bumpSessionVersion(payload.id);
        await revokeAllRefreshTokensForUser(payload.id);
      } catch {
        // still return ok so client logout proceeds
      }
    }
  } else {
    const refresh = req.cookies.get(REFRESH_COOKIE)?.value?.trim();
    if (refresh) {
      try {
        await revokeRefreshToken(refresh);
      } catch {
        // ignore
      }
    }
  }
  const res = NextResponse.json({ ok: true }, { status: 200 });
  clearAuthCookies(res);
  return res;
}
