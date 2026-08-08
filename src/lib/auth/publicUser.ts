import type { IUser } from "@/lib/models/User";
import { isProfileComplete } from "@/lib/auth/profileComplete";

const SECRET_KEYS = [
  "password",
  "emailVerifyOTP",
  "emailVerifyOTPExpiry",
  "phoneVerifyOTP",
  "phoneVerifyOTPExpiry",
  "passwordResetOTP",
  "passwordResetOTPExpiry",
  "phoneOtpSendCount",
  "phoneOtpSendWindowStart",
  "emailOtpSendCount",
  "emailOtpSendWindowStart",
  "googleId",
] as const;

/**
 * Strip secrets / OTP material from a User document before sending to clients.
 * Prefer this over `.select("-password")` alone.
 */
export function sanitizeUserForClient(
  user: IUser | Record<string, unknown> | object,
  options?: { includeHasPassword?: boolean },
): Record<string, unknown> {
  const raw =
    user && typeof (user as IUser).toObject === "function"
      ? ((user as IUser).toObject() as Record<string, unknown>)
      : { ...(user as Record<string, unknown>) };

  const hasPassword = Boolean(raw.password);
  const googleLinked = Boolean(raw.googleId);
  for (const key of SECRET_KEYS) {
    delete raw[key];
  }

  const out: Record<string, unknown> = { ...raw };
  if (options?.includeHasPassword !== false) {
    out.hasPassword = hasPassword;
  }
  out.googleLinked = googleLinked;
  try {
    out.profileComplete = isProfileComplete(user as IUser);
  } catch {
    // lean partial docs may omit fields
  }
  return out;
}

/** Mongo projection that excludes auth secrets. */
export const USER_CLIENT_EXCLUDE =
  "-password -emailVerifyOTP -emailVerifyOTPExpiry -phoneVerifyOTP -phoneVerifyOTPExpiry -passwordResetOTP -passwordResetOTPExpiry -phoneOtpSendCount -phoneOtpSendWindowStart -emailOtpSendCount -emailOtpSendWindowStart -googleId";
