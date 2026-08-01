import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { generateOtp, hashOtp } from "@/lib/security/secrets";
import { sendEmailVerificationOtp } from "@/lib/services/verificationEmail";
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
  if (user.emailVerified) {
    return NextResponse.json({ message: "Email already verified" });
  }

  const allowed = assertOtpSendAllowed(user, "email");
  if (!allowed.ok) {
    return NextResponse.json({ message: allowed.message }, { status: 429 });
  }

  const otp = generateOtp();
  user.emailVerifyOTP = hashOtp(otp);
  user.emailVerifyOTPExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  bumpOtpSend(user, "email");
  await user.save();

  const result = await sendEmailVerificationOtp({
    recipientEmail: user.email,
    recipientName: user.name,
    otp,
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message || "Failed to send email OTP" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: "OTP sent to your email",
    maskedEmail: user.email.replace(
      /(.{2}).+(@.+)/,
      (_: string, a: string, b: string) => `${a}***${b}`,
    ),
  });
}
