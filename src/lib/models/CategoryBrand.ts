import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IModel {
  name: string;
  modelNumber?: string;
  releaseYear?: number;
  isActive?: boolean;
  slug?: string;
}

export interface ICategoryBrand extends Document {
  category: string; // Now accepts any device type slug (mobile, laptop, desktop, tv, etc.)
  name: string;
  slug: string;
  logo?: string;
  models: IModel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModelSchema = new Schema<IModel>({
  name: { type: String, required: true },
  slug: { type: String, lowercase: true },
  modelNumber: { type: String },
  releaseYear: { type: Number },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const CategoryBrandSchema = new Schema<ICategoryBrand>({
  category: {
    type: String,
    required: true,
    index: true
    // Removed hardcoded enum to allow dynamic device types
  },
  name: { type: String, required: true },
  slug: { type: String, required: true, lowercase: true },
  logo: { type: String },
  models: [ModelSchema],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index for category + slug
CategoryBrandSchema.index({ category: 1, slug: 1 }, { unique: true });

export const CategoryBrand =
  mongoose.models.CategoryBrand ||
  mongoose.model<ICategoryBrand>('CategoryBrand', CategoryBrandSchema);
