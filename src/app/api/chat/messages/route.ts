import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

/** REST fallback for sending when socket is unavailable. */
export async function POST(req: NextRequest) {
  const user = requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const body = await req.json();
    const { conversationId, type, text, mediaUrl } = body || {};
    if (!conversationId) {
      return NextResponse.json(
        { message: "conversationId required" },
        { status: 400 },
      );
    }

    const result = await sendMessage({
      conversationId,
      senderId: user.id,
      type: type === "image" ? "image" : "text",
      text,
      mediaUrl,
      receiverOnline: false,
    });

    return NextResponse.json(
      {
        message: result.message,
        conversation: result.conversation,
        receiverId: result.receiverId,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
