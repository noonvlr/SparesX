import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db/connect";
import { RefreshToken } from "@/lib/models/RefreshToken";
import { REFRESH_MAX_AGE_SEC } from "@/lib/auth/cookies";

function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function digestsEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export async function issueRefreshToken(params: {
  userId: string;
  userAgent?: string | null;
}): Promise<string> {
  await connectDB();
  const raw = randomBytes(48).toString("base64url");
  const tokenHash = hashRefreshToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE_SEC * 1000);
  await RefreshToken.create({
    user: params.userId,
    tokenHash,
    expiresAt,
    userAgent: params.userAgent || "",
  });
  return raw;
}

export async function rotateRefreshToken(params: {
  rawToken: string;
  userAgent?: string | null;
}): Promise<{ userId: string; rawToken: string } | null> {
  await connectDB();
  const tokenHash = hashRefreshToken(params.rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });
  if (!existing || existing.revokedAt) return null;
  if (existing.expiresAt.getTime() <= Date.now()) return null;

  existing.revokedAt = new Date();
  await existing.save();

  const userId = String(existing.user);
  const rawToken = await issueRefreshToken({
    userId,
    userAgent: params.userAgent,
  });
  return { userId, rawToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await connectDB();
  const tokenHash = hashRefreshToken(rawToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

/** Resolve user id from a raw refresh cookie (for logout / session revoke). */
export async function findUserIdByRefreshToken(
  rawToken: string,
): Promise<string | null> {
  await connectDB();
  const tokenHash = hashRefreshToken(rawToken);
  const existing = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
  }).lean();
  if (!existing) return null;
  if (existing.expiresAt.getTime() <= Date.now()) return null;
  return String(existing.user);
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await connectDB();
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

/** Test helper — compare hashes without exporting internals. */
export function refreshTokenHashesMatch(raw: string, hash: string): boolean {
  return digestsEqual(hashRefreshToken(raw), hash);
}
