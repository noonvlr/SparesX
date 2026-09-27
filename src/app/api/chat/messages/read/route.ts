import { NextRequest, NextResponse } from "next/server";
import { getTotalUnread, markConversationRead } from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

export async function PATCH(req: NextRequest) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const body = await req.json();
    const conversationId = body?.conversationId;
    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json(
        { message: "conversationId required" },
        { status: 400 },
      );
    }

    const result = await markConversationRead({
      conversationId,
      userId: user.id,
      opened: body?.opened !== false,
    });
    const unreadTotal = await getTotalUnread(user.id);

    return NextResponse.json(
      {
        ok: true,
        modifiedCount: result.modifiedCount,
        peerIds: result.peerIds,
        unreadTotal,
      },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
