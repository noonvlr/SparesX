import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const AD_STAT_DEVICES = ["desktop", "mobile"] as const;
export type AdStatDevice = (typeof AD_STAT_DEVICES)[number];

export interface IAdDailyStat extends Document {
  /** IST calendar day YYYY-MM-DD */
  istDate: string;
  campaignId: Types.ObjectId;
  placementKey: string;
  device: AdStatDevice;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdDailyStatSchema: Schema<IAdDailyStat> = new Schema(
  {
    istDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "AdCampaign",
      required: true,
    },
    placementKey: { type: String, required: true, trim: true, maxlength: 64 },
    device: { type: String, enum: AD_STAT_DEVICES, required: true },
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

AdDailyStatSchema.index(
  { istDate: 1, campaignId: 1, placementKey: 1, device: 1 },
  { unique: true },
);
AdDailyStatSchema.index({ campaignId: 1, istDate: 1 });
AdDailyStatSchema.index({ placementKey: 1, istDate: 1 });

export const AdDailyStat: Model<IAdDailyStat> =
  mongoose.models.AdDailyStat ||
  mongoose.model<IAdDailyStat>("AdDailyStat", AdDailyStatSchema);
