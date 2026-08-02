import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";
import { verifyJwt } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const tickets = await SupportRequest.find({ user: payload.id })
      .sort({ userUnread: -1, updatedAt: -1 })
      .lean();

    const unreadCount = tickets.filter((t: any) => t.userUnread).length;

    return NextResponse.json({ tickets, unreadCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch support requests" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Login required to contact admin" },
        { status: 401 },
      );
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { type, subject, message, productId, reportedUserId } =
      await req.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { message: "Subject and message are required" },
        { status: 400 },
      );
    }

    const allowedTypes = new Set([
      "bug",
      "feature",
      "change_request",
      "issue",
      "abuse",
      "other",
    ]);
    const ticketType = allowedTypes.has(type) ? type : "issue";

    await connectDB();
    const user = await User.findById(payload.id).select("name email");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const ticketData: Record<string, unknown> = {
      user: payload.id,
      name: user.name,
      email: user.email,
      type: ticketType,
      subject: subject.trim().slice(0, 140),
      message: message.trim().slice(0, 4000),
      status: "open",
      adminUnread: true,
      userUnread: false,
    };

    if (
      reportedUserId &&
      mongoose.Types.ObjectId.isValid(String(reportedUserId))
    ) {
      ticketData.reportedUser = reportedUserId;
    }
    if (productId && mongoose.Types.ObjectId.isValid(String(productId))) {
      ticketData.product = productId;
    }

    const ticket = await SupportRequest.create(ticketData);

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to submit support request" },
      { status: 500 },
    );
  }
}

/** Mark the current user's tickets as read (after viewing admin replies). */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const ticketId = body?.ticketId as string | undefined;

    await connectDB();

    if (ticketId) {
      await SupportRequest.updateOne(
        { _id: ticketId, user: payload.id },
        { $set: { userUnread: false } },
      );
    } else {
      await SupportRequest.updateMany(
        { user: payload.id, userUnread: true },
        { $set: { userUnread: false } },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to mark as read" },
      { status: 500 },
    );
  }
}
