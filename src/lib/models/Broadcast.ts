import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type BroadcastStatus =
  | "queued"
  | "processing"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled";

export interface IBroadcast extends Document {
  createdBy: Types.ObjectId;
  idempotencyKey: string;
  text: string;
  filters: Record<string, unknown>;
  audienceDescription: string;
  status: BroadcastStatus;
  matchedCount: number;
  eligibleCount: number;
  attemptedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  maxRecipients: number;
  overLimit: boolean;
  errorSummary: string[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastSchema = new Schema<IBroadcast>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    text: { type: String, required: true, maxlength: 2000 },
    filters: { type: Schema.Types.Mixed, default: {} },
    audienceDescription: { type: String, default: "", maxlength: 1000 },
    status: {
      type: String,
      enum: [
        "queued",
        "processing",
        "completed",
        "partial",
        "failed",
        "cancelled",
      ],
      default: "queued",
      index: true,
    },
    matchedCount: { type: Number, default: 0 },
    eligibleCount: { type: Number, default: 0 },
    attemptedCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    maxRecipients: { type: Number, default: 300 },
    overLimit: { type: Boolean, default: false },
    errorSummary: { type: [String], default: [] },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

BroadcastSchema.index({ idempotencyKey: 1 }, { unique: true });
BroadcastSchema.index({ createdAt: -1 });

export const Broadcast: Model<IBroadcast> =
  mongoose.models.Broadcast ||
  mongoose.model<IBroadcast>("Broadcast", BroadcastSchema);
