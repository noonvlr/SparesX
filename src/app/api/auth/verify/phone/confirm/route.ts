import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { hashOtp } from "@/lib/security/secrets";
import {
  confirmTwilioVerifyOtp,
  TWILIO_VERIFY_SENTINEL,
} from "@/lib/services/sms";

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (isAuthError(auth)) return auth;

  const { otp } = await req.json();
  if (!otp || String(otp).trim().length < 4) {
    return NextResponse.json(
      { message: "Enter the OTP from your SMS" },
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

  const code = String(otp).trim();

  if (user.phoneVerifyOTP === TWILIO_VERIFY_SENTINEL) {
    const check = await confirmTwilioVerifyOtp({
      countryCode: user.countryCode || "+91",
      mobile: user.mobile,
      code,
    });
    if (!check.ok) {
      return NextResponse.json(
        { message: check.message || "Invalid OTP" },
        { status: 400 },
      );
    }
  } else if (user.phoneVerifyOTP !== hashOtp(code)) {
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
