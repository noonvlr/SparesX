import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const unreadCount = await SupportRequest.countDocuments({
      adminUnread: { $ne: false },
    });
    return NextResponse.json({ unreadCount }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch unread count" },
      { status: 500 },
    );
  }
}
