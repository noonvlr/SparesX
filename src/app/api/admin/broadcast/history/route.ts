import { NextRequest, NextResponse } from "next/server";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { errorResponse } from "@/lib/auth/requireUser";
import { listBroadcastHistory } from "@/lib/admin/sendBroadcast";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const sp = req.nextUrl.searchParams;
    const page = Number(sp.get("page") || 1);
    const limit = Number(sp.get("limit") || 20);
    const result = await listBroadcastHistory({ page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
