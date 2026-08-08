import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Category from "@/lib/models/Category";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidateCategoryCaches } from "@/lib/categories/revalidate";

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
      { $set: { isActive: false, updatedAt: new Date() } },
      { new: true },
    );

    revalidateCategoryCaches();

    return NextResponse.json({ category: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to disable part category" },
      { status: 500 },
    );
  }
}
