import { NextRequest, NextResponse } from "next/server";
import {
  getConversationForUser,
  listMessages,
} from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const { id } = await params;
    const conversation = await getConversationForUser(id, user.id);
    if (!conversation) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ conversation }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Paginated messages for a conversation (cursor = older ISO date). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await listMessages({
      conversationId: id,
      userId: user.id,
      cursor: body?.cursor,
      limit: body?.limit || 40,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
