import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IModel {
  name: string;
  modelNumber: string;
  releaseYear?: number;
}

export interface IMobileBrand extends Document {
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
  modelNumber: { type: String, required: true },
  releaseYear: { type: Number },
});

const MobileBrandSchema: Schema<IMobileBrand> = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true },
  logo: { type: String },
  models: [ModelSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const MobileBrand: Model<IMobileBrand> = 
  mongoose.models.MobileBrand || mongoose.model<IMobileBrand>('MobileBrand', MobileBrandSchema);
