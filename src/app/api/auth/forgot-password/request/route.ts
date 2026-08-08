import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { sendOtpEmail } from "@/lib/services/otpMailer";
import { generateOtp, hashOtp } from "@/lib/security/secrets";
import {
  checkRateLimit,
  clientIpFromRequest,
} from "@/lib/security/authRateLimit";

const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

/** Generic response — do not reveal whether the email is registered. */
const GENERIC_OK = {
  message:
    "If an account exists for that email, a verification code has been sent. Check inbox and spam.",
  success: true,
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const normalized = String(email).toLowerCase().trim();
    const ip = clientIpFromRequest(req);
    const ipLimit = checkRateLimit({
      key: `reset-req:ip:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    const emailLimit = checkRateLimit({
      key: `reset-req:email:${normalized}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.ok || !emailLimit.ok) {
      return NextResponse.json(GENERIC_OK, { status: 200 });
    }

    const user = await User.findOne({ email: normalized });

    if (!user || !user.password) {
      return NextResponse.json(GENERIC_OK, { status: 200 });
    }

    const otp = generateOtp();
    user.passwordResetOTP = hashOtp(otp);
    user.passwordResetOTPExpiry = new Date(Date.now() + OTP_EXPIRY);
    await user.save();

    const emailResult = await sendOtpEmail({
      recipientEmail: user.email,
      recipientName: user.name || user.email.split("@")[0],
      otp,
      subject: "Password Reset Verification Code - SparesX",
      expiryMinutes: 10,
      purpose: "password-reset",
    });

    if (!emailResult.ok) {
      console.warn(
        `[PASSWORD RESET] Email failed for user ${String(user._id)}: ${emailResult.message}`,
      );
      return NextResponse.json(GENERIC_OK, { status: 200 });
    }

    return NextResponse.json(GENERIC_OK, { status: 200 });
  } catch (error) {
    console.error("Error requesting OTP:", error);
    return NextResponse.json(
      { message: "Failed to process request" },
      { status: 500 },
    );
  }
}
