import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Category from "@/lib/models/Category";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidateCategoryCaches } from "@/lib/categories/revalidate";

// PUT update category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: admin.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, icon, slug, description, isActive, order } = body;

    await connectDB();

    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (existingCategory.deviceId) {
      return NextResponse.json(
        { error: "Device-scoped categories are managed in device management" },
        { status: 400 }
      );
    }

    // Check if new slug conflicts with another category
    if (slug) {
      const existing = await Category.findOne({
        slug,
        _id: { $ne: id },
        $or: [{ deviceId: { $exists: false } }, { deviceId: null }],
      });
      if (existing) {
        return NextResponse.json(
          { error: "Category with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(icon && { icon }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    revalidateCategoryCaches();

    return NextResponse.json({ category }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: admin.status });
    }

    const { id } = await params;

    await connectDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category.deviceId) {
      return NextResponse.json(
        { error: "Device-scoped categories are managed in device management" },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);

    revalidateCategoryCaches();

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
