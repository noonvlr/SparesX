import { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { getTokenFromRequest } from "@/lib/auth/getTokenFromRequest";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import type { AuthUser } from "@/lib/auth/requireUser";

/**
 * Soft auth for GETs / public surfaces: verify JWT, then re-check DB
 * (blocked + live role + sessionVersion). Returns null instead of 401.
 * Does not enforce CSRF (safe methods / non-mutating use only).
 */
export async function getOptionalUser(
  req: NextRequest,
): Promise<AuthUser | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload?.id) return null;

  await connectDB();
  const user = await User.findById(payload.id)
    .select("isBlocked role sessionVersion")
    .lean();
  if (!user || user.isBlocked) return null;

  const currentSv =
    typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
  if (payload.sv !== currentSv) return null;

  return { id: String(user._id), role: String(user.role) };
}
