import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { BadgeKey, BadgeType } from "@/lib/badges/catalog";

export interface IUserBadge extends Document {
  userId: Types.ObjectId;
  badgeKey: BadgeKey;
  badgeType: BadgeType;
  awardedAt: Date;
  awardedBy?: Types.ObjectId | "system";
  expiresAt?: Date;
  isActive: boolean;
  source: "auto" | "admin" | "system";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserBadgeSchema = new Schema<IUserBadge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    badgeKey: { type: String, required: true, index: true },
    badgeType: {
      type: String,
      enum: ["verification", "reputation", "special"],
      required: true,
    },
    awardedAt: { type: Date, default: Date.now },
    awardedBy: { type: Schema.Types.Mixed },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    source: {
      type: String,
      enum: ["auto", "admin", "system"],
      default: "auto",
    },
    note: { type: String },
  },
  { timestamps: true },
);

UserBadgeSchema.index({ userId: 1, badgeKey: 1 }, { unique: true });

export const UserBadge: Model<IUserBadge> =
  mongoose.models.UserBadge ||
  mongoose.model<IUserBadge>("UserBadge", UserBadgeSchema);
