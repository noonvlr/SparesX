import mongoose, { Schema, Document, Model } from "mongoose";

export type AdDevice = "desktop" | "mobile";

export interface AdSizeSpec {
  width: number;
  height: number;
}

export interface IAdPlacement extends Document {
  /** Immutable public key, e.g. homepage_hero */
  key: string;
  name: string;
  description: string;
  /** Human-readable where it appears on the site */
  pageLocation: string;
  desktop: AdSizeSpec;
  /** null when placement is desktop-only */
  mobile: AdSizeSpec | null;
  supportedDevices: AdDevice[];
  enabled: boolean;
  maxSlots: number;
  fallbackToHouseAds: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SizeSpecSchema = new Schema<AdSizeSpec>(
  {
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const AdPlacementSchema: Schema<IAdPlacement> = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      immutable: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    pageLocation: { type: String, required: true, trim: true, maxlength: 300 },
    desktop: { type: SizeSpecSchema, required: true },
    mobile: { type: SizeSpecSchema, default: null },
    supportedDevices: {
      type: [String],
      enum: ["desktop", "mobile"],
      default: ["desktop", "mobile"],
    },
    enabled: { type: Boolean, default: true, index: true },
    maxSlots: { type: Number, default: 1, min: 1, max: 10 },
    fallbackToHouseAds: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AdPlacementSchema.index({ key: 1 }, { unique: true });

export const AdPlacement: Model<IAdPlacement> =
  mongoose.models.AdPlacement ||
  mongoose.model<IAdPlacement>("AdPlacement", AdPlacementSchema);
