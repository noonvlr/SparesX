import { NextRequest, NextResponse } from "next/server";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { errorResponse } from "@/lib/auth/requireUser";
import { getBroadcastDetail } from "@/lib/admin/sendBroadcast";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    const result = await getBroadcastDetail(id);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
