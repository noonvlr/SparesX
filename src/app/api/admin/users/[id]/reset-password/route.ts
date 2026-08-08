import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireAdmin, isAdminError } from "@/lib/auth/requireAdmin";
import { sendOtpEmail } from "@/lib/services/otpMailer";
import { generateOtp, hashOtp } from "@/lib/security/secrets";

const OTP_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours for admin reset

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (isAdminError(auth)) return auth;

    await connectDB();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
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
      expiryMinutes: 24 * 60,
      purpose: "password-reset",
    });

    if (!emailResult.ok) {
      console.warn(
        `[ADMIN PASSWORD RESET] Email delivery failed for user ${String(user._id)}: ${emailResult.message}`,
      );
    } else {
      console.log(
        `[ADMIN PASSWORD RESET] OTP email dispatched for user ${String(user._id)}`,
      );
    }

    return NextResponse.json(
      {
        message: emailResult.ok
          ? "Password reset OTP sent to user email"
          : "OTP generated but email delivery failed. Ask the user to use forgot-password or retry.",
        emailSent: emailResult.ok,
      },
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
