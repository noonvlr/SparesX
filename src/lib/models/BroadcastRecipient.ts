import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type BroadcastRecipientStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped";

export interface IBroadcastRecipient extends Document {
  broadcastId: Types.ObjectId;
  userId: Types.ObjectId;
  status: BroadcastRecipientStatus;
  conversationId?: Types.ObjectId;
  messageId?: Types.ObjectId;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastRecipientSchema = new Schema<IBroadcastRecipient>(
  {
    broadcastId: {
      type: Schema.Types.ObjectId,
      ref: "Broadcast",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
      index: true,
    },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    error: { type: String, maxlength: 300 },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

BroadcastRecipientSchema.index(
  { broadcastId: 1, userId: 1 },
  { unique: true },
);

export const BroadcastRecipient: Model<IBroadcastRecipient> =
  mongoose.models.BroadcastRecipient ||
  mongoose.model<IBroadcastRecipient>(
    "BroadcastRecipient",
    BroadcastRecipientSchema,
  );
