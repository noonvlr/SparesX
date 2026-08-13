import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { getTokenFromRequest } from "@/lib/auth/getTokenFromRequest";
import { assertCsrfForCookieMutation } from "@/lib/auth/csrf";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";

export type AuthUser = { id: string; role: string };

/**
 * Authenticate via Bearer JWT or HttpOnly session cookie,
 * then re-validate against DB (blocked + role + session version).
 * Cookie-only mutations also require CSRF double-submit.
 */
export async function requireUser(
  req: NextRequest,
): Promise<AuthUser | NextResponse> {
  const csrfError = assertCsrfForCookieMutation(req);
  if (csrfError) return csrfError;

  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyJwt(token);
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
  // Only surface intentional app messages (status set on thrown errors).
  // Unexpected 500s must not leak driver/stack details to clients.
  if (status >= 500) {
    console.error("[api]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
  const message =
    error instanceof Error ? error.message : "Request failed";
  return NextResponse.json({ message }, { status });
}
