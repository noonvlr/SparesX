import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User, IUser } from "@/lib/models/User";
import { verifyJwt } from "@/lib/auth/jwt";
import { isProfileComplete } from "@/lib/auth/profileComplete";

function toPublicUser(user: IUser) {
  const obj = user.toObject() as Record<string, unknown>;
  const hasPassword = Boolean(obj.password);
  delete obj.password;
  return {
    ...obj,
    hasPassword,
    profileComplete: isProfileComplete(user),
  };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyJwt(token);
  if (!payload) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
  await connectDB();
  const user = await User.findById(payload.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Lazily compute badge snapshot for accounts that predate the badge system
  if (
    (!user.activeBadgeKeys || user.activeBadgeKeys.length === 0) &&
    (user.phoneVerified ||
      user.emailVerified ||
      user.isTrusted ||
      user.role === "admin")
  ) {
    const { recomputeUserBadges } = await import("@/lib/badges/engine");
    await recomputeUserBadges(String(user._id));
    const refreshed = await User.findById(payload.id);
    if (refreshed) {
      const { pickTrustFields } = await import("@/lib/trust");
      return NextResponse.json(
        {
          user: {
            ...toPublicUser(refreshed),
            ...pickTrustFields(refreshed),
          },
        },
        { status: 200 },
      );
    }
  }

  const { pickTrustFields } = await import("@/lib/trust");
  return NextResponse.json(
    { user: { ...toPublicUser(user), ...pickTrustFields(user) } },
    { status: 200 },
  );
}
