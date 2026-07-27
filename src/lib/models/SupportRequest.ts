import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SupportType =
  | "bug"
  | "feature"
  | "change_request"
  | "issue"
  | "other";

export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

export interface ISupportRequest extends Document {
  user: Types.ObjectId;
  name: string;
  email: string;
  type: SupportType;
  subject: string;
  message: string;
  status: SupportStatus;
  adminReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportRequestSchema: Schema<ISupportRequest> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: ["bug", "feature", "change_request", "issue", "other"],
      required: true,
      default: "issue",
    },
    subject: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    adminReply: { type: String, trim: true, maxlength: 4000 },
  },
  { timestamps: true },
);

export const SupportRequest: Model<ISupportRequest> =
  mongoose.models.SupportRequest ||
  mongoose.model<ISupportRequest>("SupportRequest", SupportRequestSchema);
