import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { generateOtp, hashOtp } from "@/lib/security/secrets";
import { sendSmsOtp } from "@/lib/services/sms";
import {
  assertOtpSendAllowed,
  bumpOtpSend,
  OTP_EXPIRY_MS,
} from "@/lib/services/otpRateLimit";

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (isAuthError(auth)) return auth;

  await connectDB();
  const user = await User.findById(auth.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  if (user.phoneVerified) {
    return NextResponse.json({ message: "Phone already verified" });
  }

  const allowed = assertOtpSendAllowed(user, "phone");
  if (!allowed.ok) {
    return NextResponse.json({ message: allowed.message }, { status: 429 });
  }

  const otp = generateOtp();
  user.phoneVerifyOTP = hashOtp(otp);
  user.phoneVerifyOTPExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  bumpOtpSend(user, "phone");
  await user.save();

  const result = await sendSmsOtp({
    countryCode: user.countryCode || "+91",
    mobile: user.mobile,
    otp,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 502 });
  }

  return NextResponse.json({
    message: "OTP sent to your mobile number",
    maskedMobile: `${user.countryCode || "+91"} ******${user.mobile.slice(-4)}`,
  });
}
