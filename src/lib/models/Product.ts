import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ProductStatus = 'pending' | 'approved' | 'rejected' | 'sold';
export type ProductCondition = 'new' | 'used' | 'refurbished';
/** Where the seller closed the deal when marking a listing sold. */
export type SoldVia = 'sparesx' | 'other';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  // Device category
  deviceCategory: string;    // e.g., 'mobile', 'laptop', 'desktop', 'tv'
  // Categorization
  brand: string;              // e.g., "Apple", "Samsung"
  deviceModel: string;        // e.g., "iPhone 15 Pro", "Galaxy S24" (renamed from 'model' to avoid conflict)
  modelNumber?: string;       // e.g., "A3108", "SM-S928"
  partType: string;           // e.g., "screen", "battery", "camera"
  // Legacy field for backward compatibility (will be deprecated)
  category?: string;
  condition: ProductCondition;
  priceNegotiable?: boolean;
  images: string[];
  status: ProductStatus;
  /** Pin on homepage featured section when approved */
  featured?: boolean;
  technician: Types.ObjectId;
  /** Optional ObjectId links into DeviceType / CategoryBrand / Category */
  deviceTypeId?: Types.ObjectId | null;
  brandId?: Types.ObjectId | null;
  partCategoryId?: Types.ObjectId | null;
  /** Set when status becomes sold — SparesX vs elsewhere. */
  soldVia?: SoldVia | null;
  soldAt?: Date | null;
  // SEO and searchability
  slug?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  // Device category
  deviceCategory: {
    type: String,
    required: true,
    index: true
    // Removed hardcoded enum to allow dynamic device types from DeviceType collection
  },
  // Categorization fields
  brand: { type: String, required: true, index: true },
  deviceModel: { type: String, required: true, index: true },
  modelNumber: { type: String },
  partType: { 
    type: String, 
    required: true,
    index: true
    // Removed hardcoded enum to allow dynamic part types from PartType collection
  },
  // Legacy field (kept for backward compatibility)
  category: { type: String },
  condition: { type: String, enum: ['new', 'used', 'refurbished'], required: true },
  priceNegotiable: { type: Boolean, default: false },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'sold'],
    default: 'approved',
    index: true,
  },
  featured: { type: Boolean, default: false, index: true },
  technician: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deviceTypeId: { type: Schema.Types.ObjectId, ref: 'DeviceType', default: null, index: true },
  brandId: { type: Schema.Types.ObjectId, ref: 'CategoryBrand', default: null, index: true },
  partCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  soldVia: {
    type: String,
    enum: ['sparesx', 'other'],
    default: null,
  },
  soldAt: { type: Date, default: null },
  // Additional fields
  slug: { type: String, unique: true, sparse: true },
  tags: [{ type: String }],
}, { timestamps: true });

// Create compound index for efficient filtering
ProductSchema.index({ brand: 1, deviceModel: 1, partType: 1 });
ProductSchema.index({ deviceCategory: 1, brand: 1 });
ProductSchema.index({ status: 1, featured: -1, createdAt: -1 });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, soldAt: 1 });
ProductSchema.index(
  {
    name: "text",
    brand: "text",
    deviceModel: "text",
    modelNumber: "text",
    partType: "text",
    tags: "text",
    description: "text",
  },
  {
    weights: {
      name: 10,
      brand: 8,
      deviceModel: 8,
      partType: 6,
      modelNumber: 5,
      tags: 3,
      description: 1,
    },
    name: "product_text_search",
  },
);

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
