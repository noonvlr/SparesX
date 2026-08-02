import mongoose, { Schema, Types } from "mongoose";

/**
 * Part categories used on homepage, product forms, filters, and requests.
 *
 * Two scopes share this collection:
 * - Global: `deviceId` null/absent — created via `/admin/categories`;
 *   available for every device as a fallback.
 * - Device-scoped: `deviceId` set — created via device-management;
 *   returned by `/api/categories?device=<slug>` and by unfiltered listing.
 *
 * Public reads must never exclude device-scoped docs by default.
 */
export interface ICategory {
  deviceId?: Types.ObjectId | null;
  name: string;
  icon: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new mongoose.Schema<ICategory>(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "DeviceType",
      index: true,
      required: false,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      default: "📦",
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

CategorySchema.index({ deviceId: 1, slug: 1 });
CategorySchema.index({ isActive: 1, order: 1, name: 1 });
CategorySchema.index({ deviceId: 1, name: 1 });

const Category =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
