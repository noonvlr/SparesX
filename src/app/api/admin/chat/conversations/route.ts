import { NextRequest, NextResponse } from "next/server";
import { adminListConversations } from "@/lib/chat/chatService";
import { errorResponse } from "@/lib/auth/requireUser";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const q = searchParams.get("q") || "";
    const data = await adminListConversations({ page, limit, q });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
