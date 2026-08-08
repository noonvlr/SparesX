import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { matchOpenRequestsForSeller } from "@/lib/requests/matchOpenRequestsForSeller";

/**
 * Open part requests that match the authenticated seller's approved inventory.
 */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  if (auth.role !== "technician" && auth.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      20,
      Math.max(1, parseInt(searchParams.get("limit") || "8", 10) || 8),
    );
    const items = await matchOpenRequestsForSeller(auth.id, limit);
    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to load demand matches", items: [] },
      { status: 500 },
    );
  }
}
