import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const AD_CAMPAIGN_STATUSES = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export type AdCampaignStatus = (typeof AD_CAMPAIGN_STATUSES)[number];

export const AD_ADVERTISER_TYPES = ["paid", "house"] as const;
export type AdAdvertiserType = (typeof AD_ADVERTISER_TYPES)[number];

export const AD_CREATIVE_DEVICES = ["desktop", "mobile"] as const;
export type AdCreativeDevice = (typeof AD_CREATIVE_DEVICES)[number];

export interface IAdCreative {
  placementKey: string;
  device: AdCreativeDevice;
  url: string;
  blobPathname: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  altText: string;
}

export interface IAdCampaign extends Document {
  name: string;
  advertiserName: string;
  advertiserType: AdAdvertiserType;
  description: string;
  destinationUrl: string;
  ctaLabel: string;
  internalNotes: string;
  /** Selected placements (may exist before creatives are uploaded). */
  placementKeys: string[];
  creatives: IAdCreative[];
  startDate: Date | null;
  endDate: Date | null;
  /** Rotation weight 1–5 */
  priority: number;
  status: AdCampaignStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdCreativeSchema = new Schema<IAdCreative>(
  {
    placementKey: { type: String, required: true, trim: true, maxlength: 64 },
    device: { type: String, enum: AD_CREATIVE_DEVICES, required: true },
    url: { type: String, required: true, maxlength: 2048 },
    blobPathname: { type: String, required: true, maxlength: 512 },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    bytes: { type: Number, required: true, min: 0 },
    mime: { type: String, required: true, maxlength: 64 },
    altText: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const AdCampaignSchema: Schema<IAdCampaign> = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    advertiserName: { type: String, required: true, trim: true, maxlength: 160 },
    advertiserType: {
      type: String,
      enum: AD_ADVERTISER_TYPES,
      required: true,
      default: "paid",
      index: true,
    },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    destinationUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    ctaLabel: { type: String, default: "", trim: true, maxlength: 80 },
    internalNotes: { type: String, default: "", trim: true, maxlength: 4000 },
    placementKeys: {
      type: [String],
      default: [],
    },
    creatives: { type: [AdCreativeSchema], default: [] },
    startDate: { type: Date, default: null, index: true },
    endDate: { type: Date, default: null, index: true },
    priority: { type: Number, default: 3, min: 1, max: 5 },
    status: {
      type: String,
      enum: AD_CAMPAIGN_STATUSES,
      default: "draft",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

AdCampaignSchema.index({
  status: 1,
  "creatives.placementKey": 1,
  startDate: 1,
  endDate: 1,
});
AdCampaignSchema.index({ status: 1, updatedAt: -1 });
AdCampaignSchema.index({ advertiserName: 1, status: 1 });

export function isAdCampaignStatus(value: unknown): value is AdCampaignStatus {
  return (
    typeof value === "string" &&
    (AD_CAMPAIGN_STATUSES as readonly string[]).includes(value)
  );
}

export const AdCampaign: Model<IAdCampaign> =
  mongoose.models.AdCampaign ||
  mongoose.model<IAdCampaign>("AdCampaign", AdCampaignSchema);
