import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin, isAdminError } from "@/lib/auth/requireAdmin";
import { sendSmsOtp } from "@/lib/services/sms";
import { generateOtp } from "@/lib/security/secrets";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isAdminError(auth)) return auth;

  const { mobile, countryCode } = await req.json();
  const digits = String(mobile || "").replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return NextResponse.json(
      { message: "Enter a valid 10-digit Indian mobile number" },
      { status: 400 },
    );
  }

  await connectDB();
  const otp = generateOtp();
  const result = await sendSmsOtp({
    countryCode: countryCode || "+91",
    mobile: digits,
    otp,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 502 });
  }

  return NextResponse.json({
    message: "Test SMS sent successfully",
    // Only returned for admin testing so they can confirm delivery content
    testOtpHint: "OTP was included in the SMS body",
  });
}
