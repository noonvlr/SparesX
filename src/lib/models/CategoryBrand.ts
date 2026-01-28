import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type DeviceCategory = 'mobile' | 'laptop' | 'desktop';

export interface IModel {
  name: string;
  modelNumber?: string;
  releaseYear?: number;
}

export interface ICategoryBrand extends Document {
  category: DeviceCategory;
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
  modelNumber: { type: String },
  releaseYear: { type: Number },
}, { _id: false });

const CategoryBrandSchema = new Schema<ICategoryBrand>({
  category: {
    type: String,
    enum: ['mobile', 'laptop', 'desktop'],
    required: true,
    index: true
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
