import { NextRequest, NextResponse } from "next/server";
import {
  markUserOffline,
  setConversationTyping,
  updateLastSeen,
} from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

/** Heartbeat + optional typing + explicit offline for Vercel REST presence. */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const body = await req.json().catch(() => ({}));

    if (body?.status === "offline") {
      await markUserOffline(user.id);
      return NextResponse.json({ ok: true, status: "offline" }, { status: 200 });
    }

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
