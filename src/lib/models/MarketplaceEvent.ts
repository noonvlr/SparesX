import mongoose, { Schema, Model } from "mongoose";

/**
 * Aggregated marketplace funnel events — no emails, phones, or WhatsApp numbers.
 * Used for demand vs supply intelligence and soft-launch metrics.
 */
export type MarketplaceEventType =
  | "search"
  | "product_view"
  | "chat_start"
  | "whatsapp_request"
  | "whatsapp_approved"
  | "request_created"
  | "listing_sold"
  | "rating_created";

export type MarketplaceEventDoc = {
  type: MarketplaceEventType;
  /** UTC day bucket YYYY-MM-DD for cheap rollups */
  day: string;
  productId?: string;
  brand?: string;
  partType?: string;
  deviceModel?: string;
  city?: string;
  /** Free-text search query (truncated, no PII expected) */
  query?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
};

const MarketplaceEventSchema = new Schema<MarketplaceEventDoc>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "search",
        "product_view",
        "chat_start",
        "whatsapp_request",
        "whatsapp_approved",
        "request_created",
        "listing_sold",
        "rating_created",
      ],
      index: true,
    },
    day: { type: String, required: true, index: true },
    productId: { type: String, index: true },
    brand: { type: String, trim: true, maxlength: 80 },
    partType: { type: String, trim: true, maxlength: 80 },
    deviceModel: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 80 },
    query: { type: String, trim: true, maxlength: 120 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MarketplaceEventSchema.index({ type: 1, day: -1 });
MarketplaceEventSchema.index({ brand: 1, partType: 1, day: -1 });
/** Auto-expire raw events after 180 days */
MarketplaceEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 180 * 24 * 60 * 60 },
);

export const MarketplaceEvent: Model<MarketplaceEventDoc> =
  mongoose.models.MarketplaceEvent ||
  mongoose.model<MarketplaceEventDoc>(
    "MarketplaceEvent",
    MarketplaceEventSchema,
  );
