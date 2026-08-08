import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { getTokenFromRequest } from "@/lib/auth/getTokenFromRequest";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { bumpSessionVersion } from "@/lib/auth/sessionVersion";
import {
  findUserIdByRefreshToken,
  revokeAllRefreshTokensForUser,
} from "@/lib/auth/refreshTokens";
import { assertCsrfForCookieMutation } from "@/lib/auth/csrf";

/**
 * POST /api/auth/logout — invalidate session + all refresh tokens and clear cookies.
 * Refresh-only logout also bumps sessionVersion so leftover access JWTs die.
 * Requires CSRF when a session/refresh cookie is present.
 */
export async function POST(req: NextRequest) {
  const csrfError = assertCsrfForCookieMutation(req);
  if (csrfError) return csrfError;

  let userId: string | null = null;

  const token = getTokenFromRequest(req);
  if (token) {
    const payload = verifyJwt(token);
    if (payload?.id) userId = payload.id;
  }

  if (!userId) {
    const refresh = req.cookies.get(REFRESH_COOKIE)?.value?.trim();
    if (refresh) {
      try {
        userId = await findUserIdByRefreshToken(refresh);
      } catch {
        userId = null;
      }
    }
  }

  if (userId) {
    try {
      await bumpSessionVersion(userId);
      await revokeAllRefreshTokensForUser(userId);
    } catch {
      // still return ok so client logout proceeds
    }
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  clearAuthCookies(res);
  return res;
}
