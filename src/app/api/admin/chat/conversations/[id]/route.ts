import { NextRequest, NextResponse } from "next/server";
import { adminGetConversation } from "@/lib/chat/chatService";
import { errorResponse } from "@/lib/auth/requireUser";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    const data = await adminGetConversation(id);
    if (!data) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
