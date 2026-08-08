import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin, isAdminError } from "@/lib/auth/requireAdmin";
import { sendSmsOtp, toE164 } from "@/lib/services/sms";
import { generateOtp } from "@/lib/security/secrets";
import { loadSmsRuntimeConfig } from "@/lib/services/sms";
import { startTwilioVerify } from "@/lib/services/sms/providers/twilio";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
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
  const cc = countryCode || "+91";
  const cfg = await loadSmsRuntimeConfig();

  if (
    cfg.provider === "twilio" &&
    cfg.twilio?.verifyServiceSid &&
    cfg.twilio.accountSid &&
    cfg.twilio.authToken
  ) {
    const result = await startTwilioVerify({
      accountSid: cfg.twilio.accountSid,
      authToken: cfg.twilio.authToken,
      serviceSid: cfg.twilio.verifyServiceSid,
      to: toE164(cc, digits),
    });
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 502 });
    }
    return NextResponse.json({
      message:
        "Test Verify SMS sent. Check the phone for Twilio’s OTP (works on trial if the number is verified in Twilio).",
    });
  }

  const otp = generateOtp();
  const result = await sendSmsOtp({
    countryCode: cc,
    mobile: digits,
    otp,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 502 });
  }

  return NextResponse.json({
    message: result.viaTwilioVerify
      ? "Test Verify SMS sent successfully"
      : "Test SMS sent successfully",
  });
}
