import { NextRequest, NextResponse } from "next/server";
import { getTotalUnread } from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

export async function GET(req: NextRequest) {
  const user = requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const unreadTotal = await getTotalUnread(user.id);
    return NextResponse.json({ unreadTotal }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
