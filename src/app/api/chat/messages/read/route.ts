import { NextRequest, NextResponse } from "next/server";
import { markConversationRead } from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

export async function PATCH(req: NextRequest) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const body = await req.json();
    const conversationId = body?.conversationId;
    if (!conversationId) {
      return NextResponse.json(
        { message: "conversationId required" },
        { status: 400 },
      );
    }

    const result = await markConversationRead({
      conversationId,
      userId: user.id,
    });

    return NextResponse.json(
      {
        ok: true,
        modifiedCount: result.modifiedCount,
        peerIds: result.peerIds,
      },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
