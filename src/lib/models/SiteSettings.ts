import mongoose, { Schema, Document, Model } from "mongoose";

export const SMS_PROVIDERS = ["renflair", "twilio", "msg91"] as const;
export type SmsProvider = (typeof SMS_PROVIDERS)[number];

export function isSmsProvider(value: unknown): value is SmsProvider {
  return (
    typeof value === "string" &&
    (SMS_PROVIDERS as readonly string[]).includes(value)
  );
}

export interface ISiteSettings extends Document {
  key: string;
  activeSmsProvider: SmsProvider;
  twilioAccountSid?: string;
  twilioAuthTokenEnc?: string;
  twilioFromNumber?: string;
  /** Twilio Verify Service SID (VA...). Preferred for OTP, works on trial. */
  twilioVerifyServiceSid?: string;
  /** Renflair OTP gateway API key (encrypted). */
  renflairApiKeyEnc?: string;
  msg91AuthKeyEnc?: string;
  msg91SenderId?: string;
  msg91TemplateId?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassEnc?: string;
  smtpFrom?: string;
  /**
   * When true, new technician listings start as `pending` until an admin approves.
   * Default false keeps the current auto-approve marketplace flow.
   */
  requireListingApproval?: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema: Schema<ISiteSettings> = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    activeSmsProvider: {
      type: String,
      enum: SMS_PROVIDERS,
      default: "renflair",
    },
    twilioAccountSid: { type: String, default: "" },
    twilioAuthTokenEnc: { type: String, default: "" },
    twilioFromNumber: { type: String, default: "" },
    twilioVerifyServiceSid: { type: String, default: "" },
    renflairApiKeyEnc: { type: String, default: "" },
    msg91AuthKeyEnc: { type: String, default: "" },
    msg91SenderId: { type: String, default: "" },
    msg91TemplateId: { type: String, default: "" },
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: "" },
    smtpPassEnc: { type: String, default: "" },
    smtpFrom: { type: String, default: "" },
    requireListingApproval: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export async function getOrCreateSiteSettings(): Promise<ISiteSettings> {
  let doc = await SiteSettings.findOne({ key: "default" });
  if (!doc) {
    doc = await SiteSettings.create({
      key: "default",
      activeSmsProvider: "renflair",
    });
  }
  return doc;
}
