import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateConversation,
  listConversations,
  getTotalUnread,
} from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "30", 10)),
    );
    const data = await listConversations(user.id, page, limit);
    const unreadTotal = await getTotalUnread(user.id);
    return NextResponse.json({ ...data, unreadTotal }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const body = await req.json();
    const peerId = body?.peerId || body?.receiverId;
    const productId = body?.productId;
    if (!peerId || typeof peerId !== "string") {
      return NextResponse.json(
        { message: "peerId is required" },
        { status: 400 },
      );
    }

    const conversation = await getOrCreateConversation({
      userId: user.id,
      peerId,
      productId: typeof productId === "string" ? productId : undefined,
    });

    return NextResponse.json({ conversation }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
