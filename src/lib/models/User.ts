import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "technician" | "admin";
export type AuthProvider = "local" | "google";

export interface IUser extends Document {
  name: string;
  email: string;
  /** Optional for Google-only accounts */
  password?: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;
  mobile?: string;
  countryCode: string;
  address?: string;
  pinCode?: string;
  city?: string;
  state?: string;
  whatsappNumber?: string;
  profilePicture?: string;
  /** Public bio shown on /u/[id] About section */
  about?: string;
  isBlocked: boolean;
  lastSeen?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  /** Admin-granted trusted seller status (shown as Trusted badge) */
  isTrusted: boolean;
  kycVerified: boolean;
  businessVerified: boolean;
  addressVerified: boolean;
  kycVerifiedAt?: Date;
  businessVerifiedAt?: Date;
  addressVerifiedAt?: Date;
  /** Admin-approved elite seller review */
  eliteApproved: boolean;
  completedSales: number;
  averageRating: number;
  ratingCount: number;
  responseRate: number;
  /** Inbound chat bursts used as denominator for responseRate */
  chatInboundOpportunities: number;
  /** Replies within 24h of an inbound burst (numerator) */
  chatResponseHits: number;
  complaintRate: number;
  /** Upheld abuse reports counted into complaintRate */
  complaintCount: number;
  trustScore: number;
  /** Cumulative trust points from published bug-thanks updates (+5 each) */
  bugThanksPoints: number;
  /** Snapshot of active badge keys for fast public reads */
  activeBadgeKeys: string[];
  /** Manually awarded special badges (official_store, verified_technician, moderator, founding_member) */
  specialBadgeKeys: string[];
  /** Badges explicitly revoked by admin (blocks auto re-award, e.g. founding_member) */
  revokedBadgeKeys: string[];
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  trustedAt?: Date;
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
  /** Bumped on logout, password change, block — invalidates outstanding JWTs */
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: false },
    role: { type: String, enum: ["technician", "admin"], required: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      index: true,
    },
    googleId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    mobile: { type: String, trim: true, default: "" },
    countryCode: {
      type: String,
      required: true,
      trim: true,
      default: "+91",
    },
    address: { type: String, trim: true, default: "" },
    pinCode: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    whatsappNumber: { type: String, trim: true, default: "" },
    profilePicture: { type: String, trim: true },
    about: { type: String, trim: true, maxlength: 500, default: "" },
    isBlocked: { type: Boolean, default: false },
    lastSeen: { type: Date },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isTrusted: { type: Boolean, default: false },
    kycVerified: { type: Boolean, default: false },
    businessVerified: { type: Boolean, default: false },
    addressVerified: { type: Boolean, default: false },
    kycVerifiedAt: { type: Date },
    businessVerifiedAt: { type: Date },
    addressVerifiedAt: { type: Date },
    eliteApproved: { type: Boolean, default: false },
    completedSales: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    chatInboundOpportunities: { type: Number, default: 0 },
    chatResponseHits: { type: Number, default: 0 },
    complaintRate: { type: Number, default: 0 },
    complaintCount: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0 },
    bugThanksPoints: { type: Number, default: 0 },
    activeBadgeKeys: { type: [String], default: [] },
    specialBadgeKeys: { type: [String], default: [] },
    revokedBadgeKeys: { type: [String], default: [] },
    emailVerifiedAt: { type: Date },
    phoneVerifiedAt: { type: Date },
    trustedAt: { type: Date },
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
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

/** Hot path: resolveSellerIds filters technicians by role + city (+ badges). */
UserSchema.index({ role: 1, isBlocked: 1, city: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
