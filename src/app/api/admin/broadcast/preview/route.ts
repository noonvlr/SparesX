import { NextRequest, NextResponse } from "next/server";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { errorResponse } from "@/lib/auth/requireUser";
import {
  normalizeBroadcastFilters,
} from "@/lib/admin/broadcastAudience";
import { previewBroadcastAudience } from "@/lib/admin/sendBroadcast";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = normalizeBroadcastFilters({
      ...sp,
      excludeUserId: admin.id,
    });
    const preview = await previewBroadcastAudience(filters);
    return NextResponse.json(preview);
  } catch (error) {
    return errorResponse(error);
  }
}
