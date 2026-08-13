import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import {
  SUPPORT_PRIORITY_SET,
  SUPPORT_STATUS_SET,
} from "@/lib/support/constants";
import { ensureCaseNumber } from "@/lib/support/caseNumber";
import { serializeAdminCase } from "@/lib/support/serialize";

const ADMIN_POPULATE = [
  { path: "user", select: "name email profilePicture role isBlocked" },
  { path: "reportedUser", select: "name email mobile isBlocked" },
  { path: "product", select: "name status slug images price" },
  { path: "assignedTo", select: "name email" },
  { path: "resolvedBy", select: "name email" },
];

async function loadCase(id: string) {
  return SupportRequest.findById(id)
    .populate(ADMIN_POPULATE)
    .lean();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) return admin;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    await connectDB();
    const ticket = await loadCase(id);
    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }
    await ensureCaseNumber(ticket);

    return NextResponse.json(
      { ticket: serializeAdminCase(ticket) },
      { status: 200 },
    );
  } catch (error) {
    console.error("[admin/support GET id]", error);
    return NextResponse.json(
      { message: "Failed to load ticket" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) return admin;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      status,
      adminReply,
      markRead,
      complaintUpheld,
      priority,
      assignedTo,
      note,
    } = body as Record<string, unknown>;

    await connectDB();
    const ticket = await SupportRequest.findById(id);
    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    const actor = await User.findById(admin.id).select("name").lean();
    const actorName = actor?.name || "Admin";
    const previousStatus = ticket.status;
    const previousUpheld = ticket.complaintUpheld;
    const previousPriority = ticket.priority;
    const previousAssigned = ticket.assignedTo ? String(ticket.assignedTo) : "";

    const pushAudit = (action: string, from?: string, to?: string) => {
      ticket.audit.push({
        actorId: new mongoose.Types.ObjectId(admin.id),
        actorName,
        action,
        from,
        to,
        createdAt: new Date(),
      });
    };

    if (markRead) {
      ticket.adminUnread = false;
      ticket.adminReadAt = new Date();
    }

    if (typeof status === "string" && SUPPORT_STATUS_SET.has(status)) {
      if (status !== ticket.status) {
        pushAudit("status_changed", ticket.status, status);
        ticket.status = status as typeof ticket.status;
        if (status === "resolved" || status === "closed") {
          ticket.resolvedAt = new Date();
          ticket.resolvedBy = new mongoose.Types.ObjectId(admin.id);
          pushAudit(
            status === "resolved" ? "case_resolved" : "case_closed",
            previousStatus,
            status,
          );
        } else if (
          previousStatus === "resolved" ||
          previousStatus === "closed"
        ) {
          ticket.resolvedAt = undefined;
          ticket.resolvedBy = undefined;
          pushAudit("case_reopened", previousStatus, status);
        }
      }
    }

    if (typeof priority === "string" && SUPPORT_PRIORITY_SET.has(priority)) {
      if (priority !== ticket.priority) {
        pushAudit("priority_changed", previousPriority, priority);
        ticket.priority = priority as typeof ticket.priority;
      }
    }

    if (assignedTo === null || assignedTo === "") {
      if (previousAssigned) {
        pushAudit("case_assigned", previousAssigned, "");
        ticket.assignedTo = undefined;
      }
    } else if (typeof assignedTo === "string" && mongoose.Types.ObjectId.isValid(assignedTo)) {
      const assignee = await User.findById(assignedTo).select("role name isBlocked");
      if (!assignee || assignee.role !== "admin" || assignee.isBlocked) {
        return NextResponse.json(
          { message: "Assigned user must be an active admin" },
          { status: 400 },
        );
      }
      if (String(assignee._id) !== previousAssigned) {
        pushAudit("case_assigned", previousAssigned, String(assignee._id));
        ticket.assignedTo = assignee._id as mongoose.Types.ObjectId;
      }
    }

    if (typeof note === "string" && note.trim()) {
      const trimmed = note.trim().slice(0, 4000);
      ticket.adminNotes.push({
        adminId: new mongoose.Types.ObjectId(admin.id),
        name: actorName,
        note: trimmed,
        createdAt: new Date(),
      });
      pushAudit("admin_note_added");
    }

    if (typeof adminReply === "string") {
      const trimmed = adminReply.trim().slice(0, 4000);
      const replyChanged = trimmed !== (ticket.adminReply || "");
      ticket.adminReply = trimmed;
      if (replyChanged && trimmed) {
        ticket.userUnread = true;
        pushAudit("admin_reply");
        const { createNotification } = await import(
          "@/lib/notifications/create"
        );
        void createNotification({
          userId: String(ticket.user),
          type: "support_reply",
          title: "Support replied to your ticket",
          body: (ticket.caseNumber || ticket.subject || "Your support request").slice(
            0,
            120,
          ),
          href: "/support/cases",
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
            href: absoluteUrl("/support/cases"),
          }).catch((err) => {
            console.warn("[support] reply email failed:", err);
          });
        }
      }
    }

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

    const hydrated = await loadCase(id);
    if (hydrated) await ensureCaseNumber(hydrated);

    return NextResponse.json(
      {
        ticket: hydrated ? serializeAdminCase(hydrated) : ticket,
        unreadCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[admin/support PATCH]", error);
    return NextResponse.json(
      { message: "Failed to update ticket" },
      { status: 500 },
    );
  }
}
