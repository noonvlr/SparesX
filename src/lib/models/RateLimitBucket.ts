import mongoose, { Schema, Model } from "mongoose";

type RateLimitDoc = {
  _id: string;
  count: number;
  resetAt: Date;
};

const RateLimitSchema = new Schema<RateLimitDoc>(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    resetAt: { type: Date, required: true, index: true },
  },
  { versionKey: false },
);

export const RateLimitBucket: Model<RateLimitDoc> =
  mongoose.models.RateLimitBucket ||
  mongoose.model<RateLimitDoc>("RateLimitBucket", RateLimitSchema);
