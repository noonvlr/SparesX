import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ChatDocument extends Document {
  participants: string[];
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

const ChatSchema = new Schema<ChatDocument>(
  {
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length >= 2,
        message: 'A chat must include at least two participants.',
      },
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'messaging_chats',
  }
);

ChatSchema.index({ participants: 1 });

export const ChatModel: Model<ChatDocument> =
  mongoose.models.MessagingChat || mongoose.model<ChatDocument>('MessagingChat', ChatSchema);
