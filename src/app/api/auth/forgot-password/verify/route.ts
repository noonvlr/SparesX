import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { hashOtp } from "@/lib/security/secrets";
import {
  checkRateLimit,
  clientIpFromRequest,
} from "@/lib/security/authRateLimit";

const GENERIC_FAIL = { message: "Invalid or expired verification code" };

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 },
      );
    }

    const normalized = String(email).toLowerCase().trim();
    const ip = clientIpFromRequest(req);
    const attemptLimit = checkRateLimit({
      key: `reset-verify:${ip}:${normalized}`,
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

    const otpHash = hashOtp(String(otp));
    if (otpHash !== user.passwordResetOTP) {
      return NextResponse.json(GENERIC_FAIL, { status: 400 });
    }

    // Consume OTP on successful verify — issue a short-lived single-use token
    // by rotating the hash so the same code cannot be replayed for reset alone
    // without having passed verify. Keep hash for reset step but mark verified
    // via a dedicated flag stored in expiry window (reuse OTP until reset).
    // Safer: replace OTP with a one-time reset ticket hash.
    const { generateOtp } = await import("@/lib/security/secrets");
    const ticket = generateOtp() + generateOtp();
    user.passwordResetOTP = hashOtp(ticket);
    user.passwordResetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return NextResponse.json(
      {
        message: "OTP verified successfully",
        resetTicket: ticket,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { message: "Failed to verify OTP" },
      { status: 500 },
    );
  }
}
