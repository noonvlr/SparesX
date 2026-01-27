import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ProductStatus = 'pending' | 'approved' | 'rejected';
export type ProductCondition = 'new' | 'used';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  condition: ProductCondition;
  images: string[];
  status: ProductStatus;
  technician: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  condition: { type: String, enum: ['new', 'used'], required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  technician: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
