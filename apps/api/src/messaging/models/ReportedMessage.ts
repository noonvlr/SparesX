import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ReportedMessageDocument extends Document {
  messageId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  reporterId: string;
  reason: string;
  notes?: string;
  createdAt: Date;
}

const ReportedMessageSchema = new Schema<ReportedMessageDocument>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'MessagingMessage',
    },
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'MessagingChat',
    },
    reporterId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    notes: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'messaging_reported_messages',
  }
);

ReportedMessageSchema.index({ messageId: 1, reporterId: 1 }, { unique: true });

export const ReportedMessageModel: Model<ReportedMessageDocument> =
  mongoose.models.MessagingReportedMessage ||
  mongoose.model<ReportedMessageDocument>('MessagingReportedMessage', ReportedMessageSchema);
