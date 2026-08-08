import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { verifyJwt } from "@/lib/auth/jwt";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, adminReply, markRead } = body;

    await connectDB();
    const ticket = await SupportRequest.findById(id);
    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    if (markRead) {
      ticket.adminUnread = false;
      ticket.adminReadAt = new Date();
    }

    if (status) ticket.status = status;

    if (typeof adminReply === "string") {
      const trimmed = adminReply.trim();
      const replyChanged = trimmed !== (ticket.adminReply || "");
      ticket.adminReply = trimmed;
      // New/changed admin reply becomes unread for the user
      if (replyChanged && trimmed) {
        ticket.userUnread = true;
        const { createNotification } = await import(
          "@/lib/notifications/create"
        );
        void createNotification({
          userId: String(ticket.user),
          type: "support_reply",
          title: "Support replied to your ticket",
          body: (ticket.subject || "Your support request").slice(0, 120),
          href: "/support",
          meta: { ticketId: String(ticket._id) },
        });

        const { absoluteUrl } = await import("@/lib/seo/site");
        const { sendSupportReplyEmail } = await import(
          "@/lib/services/emailService"
        );
        const toEmail = ticket.email;
        if (toEmail) {
          void sendSupportReplyEmail({
            recipientEmail: toEmail,
            recipientName: ticket.name || "there",
            subject: ticket.subject || "Your support request",
            replyPreview: trimmed,
            href: absoluteUrl("/support"),
          });
        }
      }
    }

    await ticket.save();

    const unreadCount = await SupportRequest.countDocuments({
      adminUnread: { $ne: false },
    });

    return NextResponse.json({ ticket, unreadCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update ticket" },
      { status: 500 },
    );
  }
}
