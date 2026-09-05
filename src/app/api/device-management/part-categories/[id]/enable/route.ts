import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Category from "@/lib/models/Category";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidateCategoryCaches } from "@/lib/categories/revalidate";

/**
 * Re-enable a device-scoped parts category previously soft-disabled via
 * `/disable`. Mirrors that route's auth, validation, and response shape.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: admin.status });
  }

  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    await connectDB();

    const existing = await Category.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Parts category not found" },
        { status: 404 },
      );
    }

    if (!existing.deviceId) {
      return NextResponse.json(
        { error: "This category is not device-scoped" },
        { status: 400 },
      );
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: { isActive: true, updatedAt: new Date() } },
      { new: true },
    );

    revalidateCategoryCaches();

    return NextResponse.json({ category: updated }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to enable part category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
