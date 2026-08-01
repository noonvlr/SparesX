import mongoose, { Schema, Document, Model } from "mongoose";

export type SmsProvider = "twilio" | "msg91";

export interface ISiteSettings extends Document {
  key: string;
  activeSmsProvider: SmsProvider;
  twilioAccountSid?: string;
  twilioAuthTokenEnc?: string;
  twilioFromNumber?: string;
  /** Twilio Verify Service SID (VA...). Preferred for OTP, works on trial. */
  twilioVerifyServiceSid?: string;
  msg91AuthKeyEnc?: string;
  msg91SenderId?: string;
  msg91TemplateId?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassEnc?: string;
  smtpFrom?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema: Schema<ISiteSettings> = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    activeSmsProvider: {
      type: String,
      enum: ["twilio", "msg91"],
      default: "twilio",
    },
    twilioAccountSid: { type: String, default: "" },
    twilioAuthTokenEnc: { type: String, default: "" },
    twilioFromNumber: { type: String, default: "" },
    twilioVerifyServiceSid: { type: String, default: "" },
    msg91AuthKeyEnc: { type: String, default: "" },
    msg91SenderId: { type: String, default: "" },
    msg91TemplateId: { type: String, default: "" },
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: "" },
    smtpPassEnc: { type: String, default: "" },
    smtpFrom: { type: String, default: "" },
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
    doc = await SiteSettings.create({ key: "default", activeSmsProvider: "twilio" });
  }
  return doc;
}
