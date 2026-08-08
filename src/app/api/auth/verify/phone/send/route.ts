import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { generateOtp, hashOtp } from "@/lib/security/secrets";
import { sendSmsOtp, TWILIO_VERIFY_SENTINEL } from "@/lib/services/sms";
import {
  assertOtpSendAllowed,
  bumpOtpSend,
  OTP_EXPIRY_MS,
} from "@/lib/services/otpRateLimit";

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  await connectDB();
  const user = await User.findById(auth.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  if (user.phoneVerified) {
    return NextResponse.json({ message: "Phone already verified" });
  }

  const mobile = String(user.mobile || "").replace(/\D/g, "");
  if (mobile.length < 10) {
    return NextResponse.json(
      {
        message:
          "Add a valid mobile number in your profile before verifying your phone",
      },
      { status: 400 },
    );
  }

  const allowed = assertOtpSendAllowed(user, "phone");
  if (!allowed.ok) {
    return NextResponse.json({ message: allowed.message }, { status: 429 });
  }

  const otp = generateOtp();
  bumpOtpSend(user, "phone");
  user.phoneVerifyOTPExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

  const result = await sendSmsOtp({
    countryCode: user.countryCode || "+91",
    mobile,
    otp,
  });

  if (!result.ok) {
    await user.save();
    return NextResponse.json({ message: result.message }, { status: 502 });
  }

  if (result.viaTwilioVerify) {
    // OTP is managed by Twilio Verify — do not store our generated code
    user.phoneVerifyOTP = TWILIO_VERIFY_SENTINEL;
  } else {
    user.phoneVerifyOTP = hashOtp(otp);
  }
  await user.save();

  return NextResponse.json({
    message: "OTP sent to your mobile number",
    maskedMobile: `${user.countryCode || "+91"} ******${mobile.slice(-4)}`,
    viaTwilioVerify: !!result.viaTwilioVerify,
  });
}
