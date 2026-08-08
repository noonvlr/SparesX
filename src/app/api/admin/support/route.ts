import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";
import { verifyJwt } from "@/lib/auth/jwt";

void User;

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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "40", 10) || 40),
    );

    const query: Record<string, unknown> = {};
    if (status === "unread") {
      query.adminUnread = { $ne: false };
    } else if (status && status !== "all") {
      query.status = status;
    }

    const [tickets, total, unreadCount] = await Promise.all([
      SupportRequest.find(query)
        .populate("user", "name email profilePicture role")
        .populate("reportedUser", "name email mobile")
        .populate("product", "name status")
        .sort({ adminUnread: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SupportRequest.countDocuments(query),
      SupportRequest.countDocuments({ adminUnread: { $ne: false } }),
    ]);

    return NextResponse.json(
      {
        tickets,
        unreadCount,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch support tickets" },
      { status: 500 },
    );
  }
}
