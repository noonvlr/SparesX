import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { hashOtp } from "@/lib/security/secrets";

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  const { otp } = await req.json();
  if (!otp || String(otp).length !== 6) {
    return NextResponse.json(
      { message: "Enter the 6-digit OTP" },
      { status: 400 },
    );
  }

  await connectDB();
  const user = await User.findById(auth.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({
      message: "Email already verified",
      emailVerified: true,
    });
  }

  if (
    !user.emailVerifyOTP ||
    !user.emailVerifyOTPExpiry ||
    user.emailVerifyOTPExpiry.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { message: "OTP expired. Request a new one." },
      { status: 400 },
    );
  }

  if (user.emailVerifyOTP !== hashOtp(String(otp).trim())) {
    return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerifyOTP = undefined;
  user.emailVerifyOTPExpiry = undefined;
  await user.save();

  const { recomputeUserBadges } = await import("@/lib/badges/engine");
  await recomputeUserBadges(String(user._id));

  return NextResponse.json({
    message: "Email verified successfully",
    emailVerified: true,
  });
}
