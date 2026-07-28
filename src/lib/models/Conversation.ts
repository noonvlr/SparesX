import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  productId?: Types.ObjectId;
  lastMessage?: string;
  lastMessageType?: "text" | "image";
  lastMessageTime?: Date;
  lastMessageSenderId?: Types.ObjectId;
  /** Per-user unread counts keyed by userId string */
  unreadCounts: Map<string, number>;
  /** 1:1 typing indicator (REST/Vercel-safe) */
  typingUserId?: Types.ObjectId;
  typingUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      validate: {
        validator: (v: Types.ObjectId[]) => Array.isArray(v) && v.length === 2,
        message: "Conversation must have exactly two participants",
      },
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    lastMessage: { type: String, maxlength: 2000 },
    lastMessageType: { type: String, enum: ["text", "image"] },
    lastMessageTime: { type: Date },
    lastMessageSenderId: { type: Schema.Types.ObjectId, ref: "User" },
    unreadCounts: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    typingUserId: { type: Schema.Types.ObjectId, ref: "User" },
    typingUntil: { type: Date },
  },
  { timestamps: true },
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageTime: -1 });
ConversationSchema.index(
  { participants: 1, productId: 1 },
  { unique: true, partialFilterExpression: { productId: { $type: "objectId" } } },
);

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
