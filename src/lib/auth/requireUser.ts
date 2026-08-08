import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";

export type AuthUser = { id: string; role: string };

/**
 * Authenticate Bearer JWT and re-validate against DB
 * (blocked + current role + session version).
 */
export async function requireUser(
  req: NextRequest,
): Promise<AuthUser | NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyJwt(authHeader.split(" ")[1]);
  if (!payload?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(payload.id)
    .select("isBlocked role sessionVersion")
    .lean();
  if (!user || user.isBlocked) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentSv =
    typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
  if (payload.sv !== currentSv) {
    return NextResponse.json(
      { message: "Session expired. Please log in again." },
      { status: 401 },
    );
  }

  return { id: String(user._id), role: String(user.role) };
}

export function isAuthError(
  result: AuthUser | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

export function errorResponse(error: unknown) {
  const status = (error as { status?: number })?.status || 500;
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ message }, { status });
}
