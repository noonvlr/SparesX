import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { getTokenFromRequest } from "@/lib/auth/getTokenFromRequest";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";

export type AdminPayload = { id: string; role: string };

/** Returns admin JWT payload (DB-verified) or a NextResponse error. */
export async function requireAdmin(
  req: NextRequest,
): Promise<AdminPayload | NextResponse> {
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
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const currentSv =
    typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
  if (payload.sv !== currentSv) {
    return NextResponse.json(
      { message: "Session expired. Please log in again." },
      { status: 401 },
    );
  }

  return { id: String(user._id), role: "admin" };
}

export function isAdminError(
  result: AdminPayload | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
