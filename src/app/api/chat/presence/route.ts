import { NextRequest, NextResponse } from "next/server";
import {
  markUserOffline,
  setConversationTyping,
  setConversationViewing,
  updateLastSeen,
} from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

/**
 * REST presence: heartbeat, optional typing, viewing leases for open threads,
 * and explicit offline.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const body = await req.json().catch(() => ({}));

    if (body?.status === "offline") {
      await markUserOffline(user.id);
      return NextResponse.json({ ok: true, status: "offline" }, { status: 200 });
    }

    const typingRequested =
      typeof body?.conversationId === "string" &&
      typeof body?.typing === "boolean";

    const [, viewing, typing] = await Promise.all([
      updateLastSeen(user.id),
      body?.viewing !== undefined || body?.stopViewing !== undefined
        ? setConversationViewing({
            userId: user.id,
            viewing: body.viewing,
            stopViewing: body.stopViewing,
          })
        : null,
      typingRequested
        ? setConversationTyping({
            conversationId: body.conversationId,
            userId: user.id,
            typing: body.typing,
          })
        : null,
    ]);

    return NextResponse.json(
      {
        ok: true,
        lastSeen: new Date().toISOString(),
        typing,
        viewing: viewing?.viewing ?? undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
