import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type WhatsAppConnectStatus =
  | "pending"
  | "approved"
  | "declined"
  | "expired"
  | "revoked";

export interface IWhatsAppConnect extends Document {
  /** User who requested WhatsApp access */
  requester: Types.ObjectId;
  /** Seller / peer whose WhatsApp is requested */
  seller: Types.ObjectId;
  /** Optional listing that triggered the first request (context only) */
  product?: Types.ObjectId;
  status: WhatsAppConnectStatus;
  message?: string;
  expiresAt?: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppConnectSchema = new Schema<IWhatsAppConnect>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "expired", "revoked"],
      default: "pending",
      index: true,
    },
    message: { type: String, trim: true, maxlength: 300 },
    expiresAt: { type: Date },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);

/**
 * One connection record per user pair.
 * Once approved, unlock applies to ALL products between these users.
 */
WhatsAppConnectSchema.index({ requester: 1, seller: 1 }, { unique: true });
WhatsAppConnectSchema.index({ seller: 1, status: 1, createdAt: -1 });
WhatsAppConnectSchema.index({ requester: 1, status: 1, createdAt: -1 });

export const WhatsAppConnect: Model<IWhatsAppConnect> =
  mongoose.models.WhatsAppConnect ||
  mongoose.model<IWhatsAppConnect>("WhatsAppConnect", WhatsAppConnectSchema);

export const WHATSAPP_REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000; // re-request after decline
export const WHATSAPP_PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000; // auto-expire pending
export const MAX_WHATSAPP_REQUESTS_PER_DAY = 5;
