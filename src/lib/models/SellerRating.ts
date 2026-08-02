import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISellerRating extends Document {
  rater: Types.ObjectId;
  seller: Types.ObjectId;
  product?: Types.ObjectId;
  conversation?: Types.ObjectId;
  /** Overall experience 1–5 */
  stars: number;
  /** Behaviour / professionalism 1–5 */
  behaviour: number;
  /** Response / communication 1–5 */
  response: number;
  comment?: string;
  /** Soft-hide without deleting (admin moderation) */
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SellerRatingSchema = new Schema<ISellerRating>(
  {
    rater: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      index: true,
    },
    stars: { type: Number, required: true, min: 1, max: 5 },
    behaviour: { type: Number, required: true, min: 1, max: 5 },
    response: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
    isHidden: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

/** One rating per rater → seller (updates allowed) */
SellerRatingSchema.index({ rater: 1, seller: 1 }, { unique: true });
SellerRatingSchema.index({ seller: 1, createdAt: -1 });

export const SellerRating: Model<ISellerRating> =
  mongoose.models.SellerRating ||
  mongoose.model<ISellerRating>("SellerRating", SellerRatingSchema);
