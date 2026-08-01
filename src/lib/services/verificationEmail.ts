import nodemailer from "nodemailer";
import { decryptSecret } from "@/lib/security/secrets";
import { getOrCreateSiteSettings } from "@/lib/models/SiteSettings";
import { sendOTPEmail } from "@/lib/services/emailService";

function getEnvAuth() {
  return {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
  };
}

/** Send email verification OTP using Site Settings SMTP override or env SMTP. */
export async function sendEmailVerificationOtp(params: {
  recipientEmail: string;
  recipientName: string;
  otp: string;
}): Promise<{ ok: boolean; message?: string }> {
  const settings = await getOrCreateSiteSettings();
  const hasOverride =
    !!settings.smtpHost &&
    !!settings.smtpUser &&
    !!settings.smtpPassEnc;

  if (!hasOverride) {
    const sent = await sendOTPEmail({
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      otp: params.otp,
      expiryMinutes: 10,
    });
    if (!sent) {
      return {
        ok: false,
        message:
          "Email service not configured. Ask admin to set SMTP in Site Settings or env.",
      };
    }
    return { ok: true };
  }

  try {
    const pass = decryptSecret(settings.smtpPassEnc || "");
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: !!settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass,
      },
    });

    const from =
      settings.smtpFrom ||
      `SparesX <${settings.smtpUser}>`;

    await transporter.sendMail({
      from,
      to: params.recipientEmail,
      subject: "Verify your email - SparesX",
      text: `Hi ${params.recipientName},\n\nYour SparesX email verification code is ${params.otp}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
      html: `<p>Hi ${params.recipientName},</p><p>Your SparesX email verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${params.otp}</p><p>It expires in 10 minutes.</p>`,
    });
    return { ok: true };
  } catch (e) {
    console.error("Verification email failed:", e);
    // Fallback to env transporter
    const envAuth = getEnvAuth();
    if (envAuth.user && envAuth.pass) {
      const sent = await sendOTPEmail({
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        otp: params.otp,
      });
      if (sent) return { ok: true };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to send email",
    };
  }
}
