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
  /** Affects email copy / heading */
  purpose?: "password-reset" | "email-verify" | "generic";
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
  const purpose = params.purpose || "generic";
  const safeName = escapeHtml(params.recipientName || "there");
  const heading =
    purpose === "password-reset"
      ? "Reset your password"
      : purpose === "email-verify"
        ? "Verify your email"
        : "Your verification code";
  const intro =
    purpose === "password-reset"
      ? "We received a request to reset the password for your SparesX account. Use the code below to continue."
      : purpose === "email-verify"
        ? "Confirm this email address belongs to you so buyers and sellers can trust your SparesX profile."
        : "Use the one-time code below to continue on SparesX.";

  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(params.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#0f172a;padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">SparesX</p>
              <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">India marketplace for spare parts</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(heading)}</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;">Hi ${safeName},</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">${escapeHtml(intro)}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:24px 16px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">One-time code</p>
                    <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:10px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(params.otp)}</p>
                    <p style="margin:12px 0 0;font-size:13px;color:#ef4444;font-weight:500;">Expires in ${expiry} minutes</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
                For your security, never share this code with anyone. SparesX staff will never ask for your OTP.
              </p>
              <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
                If you did not request this, you can safely ignore this email. Your account remains secure.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                © ${year} SparesX · <a href="https://sparesx.in" style="color:#64748b;text-decoration:none;">sparesx.in</a><br/>
                Need help? <a href="mailto:support@sparesx.in" style="color:#2563eb;text-decoration:none;">support@sparesx.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to: params.recipientEmail,
      subject: params.subject,
      text: `Hi ${params.recipientName},\n\n${intro}\n\nYour SparesX code is: ${params.otp}\nIt expires in ${expiry} minutes.\n\nIf you did not request this, ignore this email.\n\n— SparesX`,
      html,
    });
    console.log(
      `[email] OTP sent via ${mailer.source} to ${params.recipientEmail} id=${info.messageId}`,
    );
    return { ok: true };
  } catch (e) {
    console.error("[email] send failed:", e);
    const raw = e instanceof Error ? e.message : "Failed to send email";
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

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
