import { NextRequest, NextResponse } from "next/server";
import { listMessages } from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "40", 10)),
    );

    const data = await listMessages({
      conversationId,
      userId: user.id,
      cursor,
      limit,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
