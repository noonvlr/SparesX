import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";

export type AuthUser = { id: string; role: string };

export function requireUser(
  req: NextRequest,
): AuthUser | NextResponse {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyJwt(authHeader.split(" ")[1]);
  if (!payload?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return payload;
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
