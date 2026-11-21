import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const AD_EVENT_TYPES = ["impression", "click"] as const;
export type AdEventType = (typeof AD_EVENT_TYPES)[number];

export const AD_EVENT_DEVICES = ["desktop", "mobile"] as const;
export type AdEventDevice = (typeof AD_EVENT_DEVICES)[number];

export interface IAdEvent extends Document {
  campaignId: Types.ObjectId;
  placementKey: string;
  eventType: AdEventType;
  device: AdEventDevice;
  /** sessionId|campaignId|placementKey|eventType|30minBucket — unique */
  dedupeKey: string;
  isBot: boolean;
  createdAt: Date;
}

const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;

const AdEventSchema: Schema<IAdEvent> = new Schema(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "AdCampaign",
      required: true,
      index: true,
    },
    placementKey: { type: String, required: true, trim: true, maxlength: 64 },
    eventType: { type: String, enum: AD_EVENT_TYPES, required: true },
    device: { type: String, enum: AD_EVENT_DEVICES, required: true },
    dedupeKey: { type: String, required: true, maxlength: 200 },
    isBot: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

AdEventSchema.index({ dedupeKey: 1 }, { unique: true });
/** TTL: raw events expire after 30 days (debugging / dedupe only). */
AdEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: THIRTY_DAYS_SEC });

export const AdEvent: Model<IAdEvent> =
  mongoose.models.AdEvent ||
  mongoose.model<IAdEvent>("AdEvent", AdEventSchema);
