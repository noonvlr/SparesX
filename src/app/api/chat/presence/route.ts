import { NextRequest, NextResponse } from "next/server";
import {
  setConversationTyping,
  updateLastSeen,
} from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

/** Heartbeat + optional typing for Vercel (no Socket.IO required). */
export async function POST(req: NextRequest) {
  const user = requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const body = await req.json().catch(() => ({}));
    await updateLastSeen(user.id);

    let typing: { typingUserId: string | null; typingUntil: Date | null } | null =
      null;
    if (
      typeof body?.conversationId === "string" &&
      typeof body?.typing === "boolean"
    ) {
      typing = await setConversationTyping({
        conversationId: body.conversationId,
        userId: user.id,
        typing: body.typing,
      });
    }

    return NextResponse.json(
      { ok: true, lastSeen: new Date().toISOString(), typing },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
