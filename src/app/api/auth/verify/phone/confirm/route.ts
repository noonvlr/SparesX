import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { hashOtp } from "@/lib/security/secrets";

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
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
  if (user.phoneVerified) {
    return NextResponse.json({
      message: "Phone already verified",
      phoneVerified: true,
    });
  }

  if (
    !user.phoneVerifyOTP ||
    !user.phoneVerifyOTPExpiry ||
    user.phoneVerifyOTPExpiry.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { message: "OTP expired. Request a new one." },
      { status: 400 },
    );
  }

  if (user.phoneVerifyOTP !== hashOtp(String(otp).trim())) {
    return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
  }

  user.phoneVerified = true;
  user.phoneVerifiedAt = new Date();
  user.phoneVerifyOTP = undefined;
  user.phoneVerifyOTPExpiry = undefined;
  await user.save();

  return NextResponse.json({
    message: "Phone verified successfully",
    phoneVerified: true,
  });
}
