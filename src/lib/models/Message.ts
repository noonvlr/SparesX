import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MessageType = "text" | "image";

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  delivered: boolean;
  read: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  /** Soft-deleted for these users (hidden in their UI) */
  deletedFor: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["text", "image"],
      required: true,
      default: "text",
    },
    text: { type: String, trim: true, maxlength: 4000 },
    mediaUrl: { type: String, trim: true, maxlength: 2000 },
    delivered: { type: Boolean, default: false, index: true },
    read: { type: Boolean, default: false, index: true },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, receiverId: 1, read: 1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
