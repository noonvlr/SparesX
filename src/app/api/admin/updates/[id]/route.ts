import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import {
  isSiteUpdateKind,
  SiteUpdate,
} from "@/lib/models/SiteUpdate";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { serializeSiteUpdate } from "@/lib/updates/format";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Update not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    await connectDB();
    const doc = await SiteUpdate.findById(id);
    if (!doc) {
      return NextResponse.json({ message: "Update not found" }, { status: 404 });
    }

    if (typeof body.message === "string") {
      const message = body.message.trim();
      if (message.length < 3 || message.length > 400) {
        return NextResponse.json(
          { message: "Message must be between 3 and 400 characters" },
          { status: 400 },
        );
      }
      doc.message = message;
    }
    if (isSiteUpdateKind(body.kind)) doc.kind = body.kind;
    if (typeof body.isPublished === "boolean") doc.isPublished = body.isPublished;
    if (typeof body.mentionedName === "string") {
      doc.mentionedName = body.mentionedName.trim().slice(0, 80) || undefined;
    }
    if (body.publishedAt) {
      const d = new Date(body.publishedAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ message: "Invalid date" }, { status: 400 });
      }
      doc.publishedAt = d;
    }

    await doc.save();
    return NextResponse.json({
      message: "Update saved",
      update: serializeSiteUpdate(doc.toObject()),
    });
  } catch (error) {
    console.error("[admin/updates PATCH]", error);
    return NextResponse.json(
      { message: "Failed to update" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Update not found" }, { status: 404 });
    }
    await connectDB();
    const deleted = await SiteUpdate.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Update not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Update deleted" });
  } catch (error) {
    console.error("[admin/updates DELETE]", error);
    return NextResponse.json(
      { message: "Failed to delete update" },
      { status: 500 },
    );
  }
}
