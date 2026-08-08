import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { sanitizeUserForClient } from "@/lib/auth/publicUser";
import { applyCsrfCookie, CSRF_COOKIE } from "@/lib/auth/cookies";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  await connectDB();
  const user = await User.findById(auth.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (
    (!user.activeBadgeKeys || user.activeBadgeKeys.length === 0) &&
    (user.phoneVerified ||
      user.emailVerified ||
      user.isTrusted ||
      user.role === "admin")
  ) {
    const { recomputeUserBadges } = await import("@/lib/badges/engine");
    await recomputeUserBadges(String(user._id));
    const refreshed = await User.findById(auth.id);
    if (refreshed) {
      const { pickTrustFields } = await import("@/lib/trust");
      const res = NextResponse.json(
        {
          user: {
            ...sanitizeUserForClient(refreshed),
            ...pickTrustFields(refreshed),
          },
        },
        { status: 200 },
      );
      if (!req.cookies.get(CSRF_COOKIE)?.value) {
        applyCsrfCookie(res);
      }
      return res;
    }
  }

  const { pickTrustFields } = await import("@/lib/trust");
  const res = NextResponse.json(
    {
      user: {
        ...sanitizeUserForClient(user),
        ...pickTrustFields(user),
      },
    },
    { status: 200 },
  );
  if (!req.cookies.get(CSRF_COOKIE)?.value) {
    applyCsrfCookie(res);
  }
  return res;
}
