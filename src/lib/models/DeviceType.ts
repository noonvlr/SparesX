import mongoose, { Schema, Document } from "mongoose";

export interface IDeviceType extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  emoji: string;
  slug: string;
  description: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTypeSchema = new Schema<IDeviceType>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    emoji: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DeviceType ||
  mongoose.model<IDeviceType>("DeviceType", deviceTypeSchema);
