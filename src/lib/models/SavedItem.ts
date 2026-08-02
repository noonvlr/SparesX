import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISavedItem extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SavedItemSchema = new Schema<ISavedItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

SavedItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
SavedItemSchema.index({ userId: 1, createdAt: -1 });

export const SavedItem: Model<ISavedItem> =
  mongoose.models.SavedItem ||
  mongoose.model<ISavedItem>("SavedItem", SavedItemSchema);

/** Soft cap per user to prevent abuse */
export const MAX_SAVED_ITEMS = 100;
