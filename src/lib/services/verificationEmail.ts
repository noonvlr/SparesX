import { sendOtpEmail } from "@/lib/services/otpMailer";

/** Send email verification OTP (Site Settings SMTP or env SMTP). */
export async function sendEmailVerificationOtp(params: {
  recipientEmail: string;
  recipientName: string;
  otp: string;
}): Promise<{ ok: boolean; message?: string }> {
  const result = await sendOtpEmail({
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    otp: params.otp,
    subject: "Verify your email - SparesX",
    expiryMinutes: 10,
    purpose: "email-verify",
  });
  if (result.ok) return { ok: true };
  return { ok: false, message: result.message };
}
