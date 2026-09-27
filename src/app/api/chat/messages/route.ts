import { after, NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

/** REST send path (production has no socket server). */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const body = await req.json();
    const { conversationId, type, text, mediaUrl } = body || {};
    if (!conversationId || typeof conversationId !== "string") {
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
    });

    // Keep the serverless function alive until notify/email/push finish.
    after(() => result.notification);

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
