import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/utils/hash";
import { sendPasswordResetSuccessEmail } from "@/lib/services/emailService";
import { verifyOtp } from "@/lib/security/secrets";
import {
  checkRateLimitAsync,
  clientIpFromRequest,
} from "@/lib/security/authRateLimit";

const GENERIC_FAIL = { message: "Invalid or expired verification code" };

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: "Email, OTP, and new password are required" },
        { status: 400 },
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const normalized = String(email).toLowerCase().trim();
    const ip = clientIpFromRequest(req);
    const attemptLimit = await checkRateLimitAsync({
      key: `reset-done:${ip}:${normalized}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!attemptLimit.ok) {
      return NextResponse.json(
        { message: "Too many attempts. Try again later." },
        { status: 429 },
      );
    }

    const user = await User.findOne({ email: normalized });
    if (
      !user ||
      !user.passwordResetOTP ||
      !user.passwordResetOTPExpiry ||
      new Date() > new Date(user.passwordResetOTPExpiry)
    ) {
      return NextResponse.json(GENERIC_FAIL, { status: 400 });
    }

    if (!verifyOtp(String(otp), user.passwordResetOTP)) {
      return NextResponse.json(GENERIC_FAIL, { status: 400 });
    }

    user.password = await hashPassword(String(newPassword));
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpiry = undefined;
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();

    try {
      const { revokeAllRefreshTokensForUser } = await import(
        "@/lib/auth/refreshTokens"
      );
      await revokeAllRefreshTokensForUser(String(user._id));
    } catch (err) {
      console.warn("[auth] refresh revoke after password reset failed:", err);
    }

    sendPasswordResetSuccessEmail({
      recipientEmail: user.email,
      recipientName: user.name || user.email.split("@")[0],
    }).catch((error) => {
      console.error("Failed to send password reset success email:", error);
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { message: "Failed to reset password" },
      { status: 500 },
    );
  }
}
