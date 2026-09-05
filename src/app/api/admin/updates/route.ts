import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import {
  isSiteUpdateKind,
  SiteUpdate,
} from "@/lib/models/SiteUpdate";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import {
  buildBugThanksMessage,
  serializeSiteUpdate,
} from "@/lib/updates/format";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { createNotification } from "@/lib/notifications/create";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50),
    );
    const publishedOnly = searchParams.get("published") === "1";

    const query: Record<string, unknown> = {};
    if (publishedOnly) query.isPublished = true;

    const docs = await SiteUpdate.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      updates: docs.map((d) => serializeSiteUpdate(d)),
    });
  } catch (error) {
    console.error("[admin/updates GET]", error);
    return NextResponse.json(
      { message: "Failed to load updates" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    await connectDB();

    // Shortcut: post thanks from a support bug case
    if (body.fromCaseId) {
      const caseId = String(body.fromCaseId);
      if (!mongoose.Types.ObjectId.isValid(caseId)) {
        return NextResponse.json({ message: "Invalid case id" }, { status: 400 });
      }

      const ticket = await SupportRequest.findById(caseId)
        .select("type subject name user status")
        .lean();
      if (!ticket) {
        return NextResponse.json({ message: "Case not found" }, { status: 404 });
      }
      if (ticket.type !== "bug" && ticket.type !== "technical") {
        return NextResponse.json(
          { message: "Thanks posts are for bug / technical cases" },
          { status: 400 },
        );
      }

      const existing = await SiteUpdate.findOne({
        relatedCase: ticket._id,
        kind: "bug_thanks",
      }).lean();
      if (existing) {
        return NextResponse.json(
          {
            message: "A thanks update already exists for this case",
            update: serializeSiteUpdate(existing),
          },
          { status: 200 },
        );
      }

      const name = String(ticket.name || "a community member").trim();
      const message =
        typeof body.message === "string" && body.message.trim()
          ? body.message.trim().slice(0, 400)
          : buildBugThanksMessage(name, ticket.subject);

      const doc = await SiteUpdate.create({
        publishedAt: body.publishedAt
          ? new Date(body.publishedAt)
          : new Date(),
        kind: "bug_thanks",
        message,
        mentionedName: name.slice(0, 80),
        mentionedUser: ticket.user,
        relatedCase: ticket._id,
        isPublished: body.isPublished !== false,
        createdBy: admin.id,
      });

      if (doc.isPublished && ticket.user) {
        void createNotification({
          userId: String(ticket.user),
          type: "system",
          title: "Thank you for your bug report",
          body: message.slice(0, 400),
          href: "/technician/dashboard",
          meta: { siteUpdateId: String(doc._id), caseId },
        });
      }

      return NextResponse.json(
        {
          message: "Thanks update published",
          update: serializeSiteUpdate(doc.toObject()),
        },
        { status: 201 },
      );
    }

    const kind = isSiteUpdateKind(body.kind) ? body.kind : "notice";
    const message = String(body.message || "").trim();
    if (message.length < 3) {
      return NextResponse.json(
        { message: "Message must be at least 3 characters" },
        { status: 400 },
      );
    }
    if (message.length > 400) {
      return NextResponse.json(
        { message: "Message must be 400 characters or fewer" },
        { status: 400 },
      );
    }

    const publishedAt = body.publishedAt
      ? new Date(body.publishedAt)
      : new Date();
    if (Number.isNaN(publishedAt.getTime())) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }

    const doc = await SiteUpdate.create({
      publishedAt,
      kind,
      message,
      mentionedName:
        typeof body.mentionedName === "string"
          ? body.mentionedName.trim().slice(0, 80) || undefined
          : undefined,
      isPublished: body.isPublished !== false,
      createdBy: admin.id,
    });

    return NextResponse.json(
      {
        message: "Update created",
        update: serializeSiteUpdate(doc.toObject()),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[admin/updates POST]", error);
    return NextResponse.json(
      { message: "Failed to create update" },
      { status: 500 },
    );
  }
}
