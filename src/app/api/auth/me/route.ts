import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { sanitizeUserForClient } from "@/lib/auth/publicUser";

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
      return NextResponse.json(
        {
          user: {
            ...sanitizeUserForClient(refreshed),
            ...pickTrustFields(refreshed),
          },
        },
        { status: 200 },
      );
    }
  }

  const { pickTrustFields } = await import("@/lib/trust");
  return NextResponse.json(
    {
      user: {
        ...sanitizeUserForClient(user),
        ...pickTrustFields(user),
      },
    },
    { status: 200 },
  );
}
