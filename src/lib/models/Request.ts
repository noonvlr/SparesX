import mongoose, { Schema, Document, Model } from "mongoose";

export type RequestStatus = "open" | "fulfilled" | "closed";

export interface IRequest extends Document {
  name: string;
  email: string;
  phone?: string;
  category: string;
  brand?: string;
  deviceModel?: string;
  description: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema: Schema<IRequest> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    deviceModel: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "fulfilled", "closed"],
      default: "open",
    },
  },
  { timestamps: true },
);

export const RequestModel: Model<IRequest> =
  mongoose.models.Request || mongoose.model<IRequest>("Request", RequestSchema);
