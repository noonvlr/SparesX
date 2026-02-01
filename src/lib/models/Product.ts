import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ProductStatus = 'pending' | 'approved' | 'rejected';
export type ProductCondition = 'new' | 'used';

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
  images: string[];
  status: ProductStatus;
  technician: Types.ObjectId;
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
  condition: { type: String, enum: ['new', 'used'], required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  technician: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Additional fields
  slug: { type: String, unique: true, sparse: true },
  tags: [{ type: String }],
}, { timestamps: true });

// Create compound index for efficient filtering
ProductSchema.index({ brand: 1, deviceModel: 1, partType: 1 });
ProductSchema.index({ deviceCategory: 1, brand: 1 });

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
