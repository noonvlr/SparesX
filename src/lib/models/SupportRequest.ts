import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type {
  SupportPriority,
  SupportStatus,
  SupportTargetType,
  SupportType,
} from "@/lib/support/constants";

export type {
  SupportPriority,
  SupportStatus,
  SupportTargetType,
  SupportType,
};

export interface ISupportAdminNote {
  adminId: Types.ObjectId;
  name: string;
  note: string;
  createdAt: Date;
}

export interface ISupportAuditEvent {
  actorId?: Types.ObjectId;
  actorName?: string;
  action: string;
  from?: string;
  to?: string;
  createdAt: Date;
}

export interface ISupportRequest extends Document {
  user: Types.ObjectId;
  name: string;
  email: string;
  type: SupportType;
  targetType: SupportTargetType;
  reason?: string;
  subject: string;
  message: string;
  status: SupportStatus;
  priority: SupportPriority;
  caseNumber?: string;
  adminReply?: string;
  /** Listed seller / user being reported */
  reportedUser?: Types.ObjectId;
  /**
   * When an abuse ticket is resolved/closed, whether it counts against the
   * reported seller's complaintRate. Defaults to true on resolve.
   */
  complaintUpheld?: boolean | null;
  /** Product context for abuse reports */
  product?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  messageId?: Types.ObjectId;
  productSnapshot?: Record<string, unknown>;
  reportedUserSnapshot?: Record<string, unknown>;
  messageSnapshot?: Record<string, unknown>;
  source?: { pageUrl?: string; pageType?: string };
  attachments: string[];
  assignedTo?: Types.ObjectId;
  adminNotes: ISupportAdminNote[];
  audit: ISupportAuditEvent[];
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  /** Unread for admin (new ticket / new user activity) */
  adminUnread: boolean;
  adminReadAt?: Date;
  /** Unread for the user (new admin reply) */
  userUnread: boolean;
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
      enum: [
        "bug",
        "feature",
        "change_request",
        "issue",
        "abuse",
        "account",
        "buying",
        "selling",
        "payment",
        "messaging",
        "technical",
        "safety",
        "other",
      ],
      required: true,
      default: "issue",
      index: true,
    },
    targetType: {
      type: String,
      enum: ["none", "product", "user", "message"],
      default: "none",
      index: true,
    },
    reason: { type: String, trim: true, maxlength: 80, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting_user", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
      index: true,
    },
    caseNumber: { type: String, trim: true, unique: true, sparse: true },
    adminReply: { type: String, trim: true, maxlength: 4000 },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", index: true },
    complaintUpheld: { type: Boolean, default: null },
    product: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", index: true },
    messageId: { type: Schema.Types.ObjectId, ref: "Message", index: true },
    productSnapshot: { type: Schema.Types.Mixed },
    reportedUserSnapshot: { type: Schema.Types.Mixed },
    messageSnapshot: { type: Schema.Types.Mixed },
    source: {
      pageUrl: { type: String, trim: true, maxlength: 500 },
      pageType: { type: String, trim: true, maxlength: 80 },
    },
    attachments: [{ type: String, trim: true, maxlength: 2048 }],
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    adminNotes: [
      {
        adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, trim: true, maxlength: 120 },
        note: { type: String, required: true, trim: true, maxlength: 4000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    audit: [
      {
        actorId: { type: Schema.Types.ObjectId, ref: "User" },
        actorName: { type: String, trim: true, maxlength: 120 },
        action: { type: String, required: true, trim: true, maxlength: 80 },
        from: { type: String, trim: true, maxlength: 200 },
        to: { type: String, trim: true, maxlength: 200 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    adminUnread: { type: Boolean, default: true, index: true },
    adminReadAt: { type: Date },
    userUnread: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

SupportRequestSchema.index({ createdAt: -1 });
SupportRequestSchema.index({ updatedAt: -1 });
SupportRequestSchema.index({ type: 1, status: 1, createdAt: -1 });

export const SupportRequest: Model<ISupportRequest> =
  mongoose.models.SupportRequest ||
  mongoose.model<ISupportRequest>("SupportRequest", SupportRequestSchema);
