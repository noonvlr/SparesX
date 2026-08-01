import type { IUser } from "@/lib/models/User";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS = 5;

export function assertOtpSendAllowed(
  user: IUser,
  channel: "phone" | "email",
): { ok: true } | { ok: false; message: string } {
  const countKey = channel === "phone" ? "phoneOtpSendCount" : "emailOtpSendCount";
  const windowKey =
    channel === "phone" ? "phoneOtpSendWindowStart" : "emailOtpSendWindowStart";

  const count = (user as any)[countKey] || 0;
  const windowStart = (user as any)[windowKey] as Date | undefined;
  const now = Date.now();

  if (!windowStart || now - new Date(windowStart).getTime() > WINDOW_MS) {
    (user as any)[countKey] = 0;
    (user as any)[windowKey] = new Date();
    return { ok: true };
  }

  if (count >= MAX_SENDS) {
    return {
      ok: false,
      message: "Too many OTP requests. Try again in 15 minutes.",
    };
  }
  return { ok: true };
}

export function bumpOtpSend(user: IUser, channel: "phone" | "email") {
  const countKey = channel === "phone" ? "phoneOtpSendCount" : "emailOtpSendCount";
  const windowKey =
    channel === "phone" ? "phoneOtpSendWindowStart" : "emailOtpSendWindowStart";
  if (!(user as any)[windowKey]) {
    (user as any)[windowKey] = new Date();
  }
  (user as any)[countKey] = ((user as any)[countKey] || 0) + 1;
}

export const OTP_EXPIRY_MS = 10 * 60 * 1000;
