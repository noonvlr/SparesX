import mongoose, { Document, Model, Schema } from 'mongoose';

export type MessageType = 'text' | 'image' | 'video' | 'file';
export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface MessageDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaMetadata?: Record<string, unknown>;
  localId?: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<MessageDocument>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'file'],
      default: 'text',
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    mediaUrl: String,
    mediaMetadata: {
      type: Schema.Types.Mixed,
    },
    localId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
    collection: 'messaging_messages',
  }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, createdAt: 1 });

export const MessageModel: Model<MessageDocument> =
  mongoose.models.MessagingMessage || mongoose.model<MessageDocument>('MessagingMessage', MessageSchema);
