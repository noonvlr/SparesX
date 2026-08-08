import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type RequestStatus = "open" | "fulfilled" | "closed";

export interface IRequest extends Document {
  name: string;
  email: string;
  phone?: string;
  category: string; // part type / what they need
  deviceCategory?: string;
  brand?: string;
  deviceModel?: string;
  description: string;
  status: RequestStatus;
  userId?: Types.ObjectId;
  /** Catalog ObjectId refs when resolvable from string fields */
  deviceTypeId?: Types.ObjectId | null;
  brandId?: Types.ObjectId | null;
  partCategoryId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema: Schema<IRequest> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    deviceCategory: { type: String, trim: true, index: true },
    brand: { type: String, trim: true },
    deviceModel: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "fulfilled", "closed"],
      default: "open",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    deviceTypeId: {
      type: Schema.Types.ObjectId,
      ref: "DeviceType",
      default: null,
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "CategoryBrand",
      default: null,
      index: true,
    },
    partCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

export const RequestModel: Model<IRequest> =
  mongoose.models.Request || mongoose.model<IRequest>("Request", RequestSchema);
