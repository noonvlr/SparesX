import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { sendOtpEmail } from "@/lib/services/otpMailer";
import crypto from "crypto";

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
    const user = await User.findOne({ email: normalized });

    // Always return the same message (anti-enumeration)
    if (!user || !user.password) {
      return NextResponse.json(GENERIC_OK, { status: 200 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY);

    user.passwordResetOTP = otpHash;
    user.passwordResetOTPExpiry = otpExpiry;
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
        `[PASSWORD RESET] Email failed for ${normalized}: ${emailResult.message}`,
      );
      // Still generic — don't leak delivery failures tied to account existence
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
