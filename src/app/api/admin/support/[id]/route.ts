import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) return admin;

    const { id } = await params;
    const body = await req.json();
    const { status, adminReply, markRead, complaintUpheld } = body;

    await connectDB();
    const ticket = await SupportRequest.findById(id);
    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    const previousStatus = ticket.status;
    const previousUpheld = ticket.complaintUpheld;

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

    // Closed-loop complaintRate: abuse tickets with a reported seller.
    if (
      ticket.type === "abuse" &&
      ticket.reportedUser &&
      (status || typeof complaintUpheld === "boolean")
    ) {
      const terminal =
        ticket.status === "resolved" || ticket.status === "closed";
      if (terminal) {
        ticket.complaintUpheld =
          typeof complaintUpheld === "boolean" ? complaintUpheld : true;
      } else if (previousStatus === "resolved" || previousStatus === "closed") {
        ticket.complaintUpheld = null;
      }
    }

    await ticket.save();

    if (
      ticket.type === "abuse" &&
      ticket.reportedUser &&
      (ticket.status !== previousStatus ||
        ticket.complaintUpheld !== previousUpheld)
    ) {
      const { recomputeComplaintRate } = await import(
        "@/lib/trust/complaintRate"
      );
      void recomputeComplaintRate(ticket.reportedUser);
    }

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
