import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { signJwt } from "@/lib/auth/jwt";
import {
  applyAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "@/lib/auth/cookies";
import { rotateRefreshToken } from "@/lib/auth/refreshTokens";

/**
 * POST /api/auth/refresh — rotate refresh cookie and issue new access JWT.
 * CSRF not required (cookie pair only; no body side effects beyond session).
 */
export async function POST(req: NextRequest) {
  try {
    const raw = req.cookies.get(REFRESH_COOKIE)?.value?.trim();
    if (!raw) {
      const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    const rotated = await rotateRefreshToken({
      rawToken: raw,
      userAgent: req.headers.get("user-agent"),
    });
    if (!rotated) {
      const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    await connectDB();
    const user = await User.findById(rotated.userId).select(
      "_id role sessionVersion isBlocked",
    );
    if (!user || user.isBlocked) {
      const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    const accessToken = signJwt({
      _id: user._id,
      role: user.role,
      sessionVersion: user.sessionVersion || 0,
    });
    const res = NextResponse.json({ ok: true }, { status: 200 });
    await applyAuthCookies(res, accessToken, {
      refreshRaw: rotated.rawToken,
    });
    return res;
  } catch {
    const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }
}
