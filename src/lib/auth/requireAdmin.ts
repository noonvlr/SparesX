import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";

export type AdminPayload = { id: string; role: string };

/** Returns admin JWT payload or a NextResponse error. */
export function requireAdmin(
  req: NextRequest,
): AdminPayload | NextResponse {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyJwt(authHeader.split(" ")[1]);
  if (!payload) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (payload.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return payload;
}

export function isAdminError(
  result: AdminPayload | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
