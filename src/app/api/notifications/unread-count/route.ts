import { NextRequest, NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { countUnreadNotifications } from "@/lib/notifications/create";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    const unreadCount = await countUnreadNotifications(auth.id);
    return NextResponse.json({ unreadCount }, { status: 200 });
  } catch {
    return NextResponse.json({ unreadCount: 0 }, { status: 200 });
  }
}
