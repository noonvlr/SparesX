import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getOrCreateSiteSettings, isSmsProvider } from "@/lib/models/SiteSettings";
import { requireAdmin, isAdminError } from "@/lib/auth/requireAdmin";
import {
  canEncryptSecrets,
  encryptSecret,
  maskSecret,
} from "@/lib/security/secrets";

function publicSettings(doc: Awaited<ReturnType<typeof getOrCreateSiteSettings>>) {
  return {
    activeSmsProvider: doc.activeSmsProvider,
    twilioAccountSid: doc.twilioAccountSid || "",
    twilioAuthTokenMasked: maskSecret(doc.twilioAuthTokenEnc),
    twilioFromNumber: doc.twilioFromNumber || "",
    twilioVerifyServiceSid: doc.twilioVerifyServiceSid || "",
    twilioConfigured: !!(
      doc.twilioAccountSid &&
      doc.twilioAuthTokenEnc &&
      (doc.twilioVerifyServiceSid || doc.twilioFromNumber)
    ),
    renflairApiKeyMasked: maskSecret(doc.renflairApiKeyEnc),
    renflairConfigured: !!doc.renflairApiKeyEnc,
    msg91AuthKeyMasked: maskSecret(doc.msg91AuthKeyEnc),
    msg91SenderId: doc.msg91SenderId || "",
    msg91TemplateId: doc.msg91TemplateId || "",
    msg91Configured: !!(doc.msg91AuthKeyEnc && doc.msg91SenderId),
    smtpHost: doc.smtpHost || "",
    smtpPort: doc.smtpPort || 587,
    smtpSecure: !!doc.smtpSecure,
    smtpUser: doc.smtpUser || "",
    smtpPassMasked: maskSecret(doc.smtpPassEnc),
    smtpFrom: doc.smtpFrom || "",
    smtpConfigured: !!(doc.smtpHost && doc.smtpUser && doc.smtpPassEnc),
    requireListingApproval: !!doc.requireListingApproval,
    encryptionReady: canEncryptSecrets(),
    updatedAt: doc.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAdminError(auth)) return auth;

  await connectDB();
  const doc = await getOrCreateSiteSettings();
  return NextResponse.json({ settings: publicSettings(doc) });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAdminError(auth)) return auth;

  const body = await req.json();
  const touchingSecrets =
    (typeof body.twilioAuthToken === "string" && body.twilioAuthToken.trim()) ||
    (typeof body.renflairApiKey === "string" && body.renflairApiKey.trim()) ||
    (typeof body.msg91AuthKey === "string" && body.msg91AuthKey.trim()) ||
    (typeof body.smtpPass === "string" && body.smtpPass.trim());

  if (touchingSecrets && !canEncryptSecrets()) {
    return NextResponse.json(
      {
        message:
          "SETTINGS_ENCRYPTION_KEY must be set in environment (32+ characters) before saving credentials.",
      },
      { status: 400 },
    );
  }

  await connectDB();
  const doc = await getOrCreateSiteSettings();

  if (isSmsProvider(body.activeSmsProvider)) {
    doc.activeSmsProvider = body.activeSmsProvider;
  }

  if (typeof body.twilioAccountSid === "string") {
    doc.twilioAccountSid = body.twilioAccountSid.trim();
  }
  if (typeof body.twilioFromNumber === "string") {
    doc.twilioFromNumber = body.twilioFromNumber.trim();
  }
  if (typeof body.twilioVerifyServiceSid === "string") {
    doc.twilioVerifyServiceSid = body.twilioVerifyServiceSid.trim();
  }
  if (typeof body.twilioAuthToken === "string" && body.twilioAuthToken.trim()) {
    doc.twilioAuthTokenEnc = encryptSecret(body.twilioAuthToken.trim());
  }

  if (typeof body.renflairApiKey === "string" && body.renflairApiKey.trim()) {
    doc.renflairApiKeyEnc = encryptSecret(body.renflairApiKey.trim());
  }

  if (typeof body.msg91SenderId === "string") {
    doc.msg91SenderId = body.msg91SenderId.trim();
  }
  if (typeof body.msg91TemplateId === "string") {
    doc.msg91TemplateId = body.msg91TemplateId.trim();
  }
  if (typeof body.msg91AuthKey === "string" && body.msg91AuthKey.trim()) {
    doc.msg91AuthKeyEnc = encryptSecret(body.msg91AuthKey.trim());
  }

  if (typeof body.smtpHost === "string") doc.smtpHost = body.smtpHost.trim();
  if (typeof body.smtpPort === "number") doc.smtpPort = body.smtpPort;
  if (typeof body.smtpSecure === "boolean") doc.smtpSecure = body.smtpSecure;
  if (typeof body.smtpUser === "string") doc.smtpUser = body.smtpUser.trim();
  if (typeof body.smtpFrom === "string") doc.smtpFrom = body.smtpFrom.trim();
  if (typeof body.smtpPass === "string" && body.smtpPass.trim()) {
    doc.smtpPassEnc = encryptSecret(body.smtpPass.trim());
  }

  if (typeof body.requireListingApproval === "boolean") {
    doc.requireListingApproval = body.requireListingApproval;
  }

  doc.updatedBy = auth.id as any;
  await doc.save();

  return NextResponse.json({
    message: "Site settings saved",
    settings: publicSettings(doc),
  });
}
