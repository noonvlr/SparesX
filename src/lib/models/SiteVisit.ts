import mongoose, { Schema, Model } from "mongoose";
import { VISIT_RETENTION_DAYS } from "@/lib/analytics/visitRules";

/**
 * One row per anonymous browser per UTC day.
 * The key is a random cookie, not an account id, email, or IP address.
 */
export type SiteVisitDoc = {
  visitorKey: string;
  day: string;
  createdAt: Date;
};

const SiteVisitSchema = new Schema<SiteVisitDoc>(
  {
    visitorKey: { type: String, required: true, maxlength: 32 },
    day: { type: String, required: true, maxlength: 10 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

SiteVisitSchema.index({ visitorKey: 1, day: 1 }, { unique: true });
SiteVisitSchema.index({ day: 1 });
SiteVisitSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: VISIT_RETENTION_DAYS * 24 * 60 * 60 },
);

export const SiteVisit: Model<SiteVisitDoc> =
  mongoose.models.SiteVisit ||
  mongoose.model<SiteVisitDoc>("SiteVisit", SiteVisitSchema);
