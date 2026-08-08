import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "whatsapp_request"
  | "whatsapp_approved"
  | "whatsapp_declined"
  | "chat_message"
  | "request_match"
  | "part_request"
  | "saved_search"
  | "seller_rating"
  | "listing_approved"
  | "listing_rejected"
  | "listing_sold"
  | "verification_update"
  | "support_reply"
  | "system";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  readAt?: Date | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "whatsapp_request",
        "whatsapp_approved",
        "whatsapp_declined",
        "chat_message",
        "request_match",
        "part_request",
        "saved_search",
        "seller_rating",
        "listing_approved",
        "listing_rejected",
        "listing_sold",
        "verification_update",
        "support_reply",
        "system",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 400 },
    href: { type: String, trim: true, maxlength: 300 },
    readAt: { type: Date, default: null },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, readAt: 1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
