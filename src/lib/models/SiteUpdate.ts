import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const SITE_UPDATE_KINDS = [
  "bug_thanks",
  "feature",
  "fix",
  "notice",
] as const;

export type SiteUpdateKind = (typeof SITE_UPDATE_KINDS)[number];

export function isSiteUpdateKind(value: unknown): value is SiteUpdateKind {
  return (
    typeof value === "string" &&
    (SITE_UPDATE_KINDS as readonly string[]).includes(value)
  );
}

export interface ISiteUpdate extends Document {
  publishedAt: Date;
  kind: SiteUpdateKind;
  message: string;
  mentionedName?: string;
  mentionedUser?: Types.ObjectId;
  relatedCase?: Types.ObjectId;
  isPublished: boolean;
  /** True after +5 trust points were granted to mentionedUser */
  pointsAwarded: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SiteUpdateSchema: Schema<ISiteUpdate> = new Schema(
  {
    publishedAt: { type: Date, required: true, index: true, default: Date.now },
    kind: {
      type: String,
      enum: SITE_UPDATE_KINDS,
      required: true,
      default: "notice",
      index: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 400 },
    mentionedName: { type: String, trim: true, maxlength: 80 },
    mentionedUser: { type: Schema.Types.ObjectId, ref: "User", index: true },
    relatedCase: {
      type: Schema.Types.ObjectId,
      ref: "SupportRequest",
      index: true,
    },
    isPublished: { type: Boolean, default: true, index: true },
    pointsAwarded: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

SiteUpdateSchema.index({ isPublished: 1, publishedAt: -1 });

export const SiteUpdate: Model<ISiteUpdate> =
  mongoose.models.SiteUpdate ||
  mongoose.model<ISiteUpdate>("SiteUpdate", SiteUpdateSchema);
