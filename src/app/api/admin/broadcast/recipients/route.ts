import { NextRequest, NextResponse } from "next/server";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { errorResponse } from "@/lib/auth/requireUser";
import { normalizeBroadcastFilters } from "@/lib/admin/broadcastAudience";
import { listBroadcastRecipients } from "@/lib/admin/broadcastAudience";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    const page = Number(sp.page || 1);
    const limit = Number(sp.limit || 25);
    const filters = normalizeBroadcastFilters({
      ...sp,
      excludeUserId: admin.id,
    });
    const result = await listBroadcastRecipients({ filters, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
