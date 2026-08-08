import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUserBlock extends Document {
  blocker: Types.ObjectId;
  blocked: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserBlockSchema = new Schema<IUserBlock>(
  {
    blocker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blocked: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

UserBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export const UserBlock: Model<IUserBlock> =
  mongoose.models.UserBlock ||
  mongoose.model<IUserBlock>("UserBlock", UserBlockSchema);
