import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'technician' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  mobile: string;
  countryCode: string;
  address: string;
  pinCode: string;
  city: string;
  state: string;
  whatsappNumber: string;
  profilePicture?: string;
  isBlocked: boolean;
  lastSeen?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  emailVerifyOTP?: string;
  emailVerifyOTPExpiry?: Date;
  phoneVerifyOTP?: string;
  phoneVerifyOTPExpiry?: Date;
  phoneOtpSendCount?: number;
  phoneOtpSendWindowStart?: Date;
  emailOtpSendCount?: number;
  emailOtpSendWindowStart?: Date;
  passwordResetOTP?: string;
  passwordResetOTPExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['technician', 'admin'], required: true },
  mobile: { type: String, required: true, trim: true },
  countryCode: { type: String, required: true, trim: true, default: '+91' },
  address: { type: String, required: true, trim: true },
  pinCode: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  whatsappNumber: { type: String, required: true, trim: true },
  profilePicture: { type: String, trim: true },
  isBlocked: { type: Boolean, default: false },
  lastSeen: { type: Date },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailVerifiedAt: { type: Date },
  phoneVerifiedAt: { type: Date },
  emailVerifyOTP: { type: String, default: undefined },
  emailVerifyOTPExpiry: { type: Date, default: undefined },
  phoneVerifyOTP: { type: String, default: undefined },
  phoneVerifyOTPExpiry: { type: Date, default: undefined },
  phoneOtpSendCount: { type: Number, default: 0 },
  phoneOtpSendWindowStart: { type: Date },
  emailOtpSendCount: { type: Number, default: 0 },
  emailOtpSendWindowStart: { type: Date },
  passwordResetOTP: { type: String, default: undefined },
  passwordResetOTPExpiry: { type: Date, default: undefined },
}, { timestamps: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
