import nodemailer from "nodemailer";
import { connectDB } from "@/lib/db/connect";
import { getOrCreateSiteSettings } from "@/lib/models/SiteSettings";
import { decryptSecret } from "@/lib/security/secrets";

export type SendMailResult = { ok: true } | { ok: false; message: string };

function envAuth() {
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || "")
    .replace(/\s/g, "")
    .trim();
  return { user, pass };
}

async function createTransporter(): Promise<{
  transporter: any;
  from: string;
  source: "site-settings" | "env";
} | null> {
  await connectDB();
  const settings = await getOrCreateSiteSettings();

  if (settings.smtpHost && settings.smtpUser && settings.smtpPassEnc) {
    try {
      const pass = decryptSecret(settings.smtpPassEnc).replace(/\s/g, "");
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
        settings.smtpFrom?.trim() || `SparesX <${settings.smtpUser}>`;
      return { transporter, from, source: "site-settings" };
    } catch (e) {
      console.error("Site Settings SMTP decrypt/create failed:", e);
      // fall through to env
    }
  }

  const auth = envAuth();
  if (!auth.user || !auth.pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true";

  const transporter = host.includes("gmail.com")
    ? nodemailer.createTransport({
        service: "gmail",
        auth,
      })
    : nodemailer.createTransport({
        host,
        port,
        secure,
        auth,
      });

  return {
    transporter,
    from: `SparesX <${auth.user}>`,
    source: "env",
  };
}

export async function sendOtpEmail(params: {
  recipientEmail: string;
  recipientName: string;
  otp: string;
  subject: string;
  expiryMinutes?: number;
}): Promise<SendMailResult> {
  const mailer = await createTransporter();
  if (!mailer) {
    return {
      ok: false,
      message:
        "Email (SMTP) is not configured. Set SMTP_USER/SMTP_PASS in Vercel, or fill Email OTP SMTP in Admin → Site settings, then try again.",
    };
  }

  const expiry = params.expiryMinutes ?? 10;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1e40af">SparesX</h2>
      <p>Hi ${params.recipientName},</p>
      <p>Your verification code is:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1e40af">${params.otp}</p>
      <p>This code expires in ${expiry} minutes.</p>
      <p style="color:#64748b;font-size:13px">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to: params.recipientEmail,
      subject: params.subject,
      text: `Hi ${params.recipientName},\n\nYour SparesX code is ${params.otp}. It expires in ${expiry} minutes.`,
      html,
    });
    console.log(
      `[email] OTP sent via ${mailer.source} to ${params.recipientEmail} id=${info.messageId}`,
    );
    return { ok: true };
  } catch (e) {
    console.error("[email] send failed:", e);
    const raw = e instanceof Error ? e.message : "Failed to send email";
    // Friendlier hints for common Gmail failures
    let message = raw;
    if (/Invalid login|Username and Password not accepted|EAUTH/i.test(raw)) {
      message =
        "SMTP login failed. Use a Gmail App Password (not your normal password), ensure SMTP_USER/SMTP_PASS are set for Production, and redeploy.";
    } else if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(raw)) {
      message =
        "Could not connect to the SMTP server. Check SMTP_HOST and SMTP_PORT.";
    }
    return { ok: false, message };
  }
}
