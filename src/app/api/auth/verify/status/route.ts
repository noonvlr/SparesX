import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  await connectDB();
  const user = await User.findById(auth.id).select(
    "email mobile countryCode emailVerified phoneVerified emailVerifiedAt phoneVerifiedAt role password",
  );
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    email: user.email,
    mobile: user.mobile,
    countryCode: user.countryCode,
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.phoneVerified,
    emailVerifiedAt: user.emailVerifiedAt || null,
    phoneVerifiedAt: user.phoneVerifiedAt || null,
    hasPassword: Boolean(user.password),
    role: user.role,
  });
}
