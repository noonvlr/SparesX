import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { verifyJwt } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const unreadCount = await SupportRequest.countDocuments({
      adminUnread: { $ne: false },
    });

    return NextResponse.json({ unreadCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch unread count", unreadCount: 0 },
      { status: 500 },
    );
  }
}
