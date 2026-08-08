import { NextRequest, NextResponse } from "next/server";
import { softDeleteMessage } from "@/lib/chat/chatService";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const { id } = await params;
    const message = await softDeleteMessage({
      messageId: id,
      userId: user.id,
    });
    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
