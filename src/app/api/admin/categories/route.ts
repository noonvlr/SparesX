import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Category from "@/lib/models/Category";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidateCategoryCaches } from "@/lib/categories/revalidate";

// GET all categories (admin)
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.status },
      );
    }

    await connectDB();
    const categories = await Category.find({
      $or: [{ deviceId: { $exists: false } }, { deviceId: null }],
    }).sort({ order: 1, name: 1 });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

// POST create new category
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.status },
      );
    }

    const body = await req.json();
    const { name, icon, slug, description, isActive, order } = body;

    if (!name || !icon || !slug) {
      return NextResponse.json(
        { error: "Name, icon, and slug are required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check if slug already exists
    const existing = await Category.findOne({
      slug,
      $or: [{ deviceId: { $exists: false } }, { deviceId: null }],
    });
    if (existing) {
      return NextResponse.json(
        { error: "Category with this slug already exists" },
        { status: 400 },
      );
    }

    const category = await Category.create({
      name,
      icon,
      slug,
      description,
      isActive: isActive ?? true,
      order: order ?? 0,
      deviceId: null,
    });

    revalidateCategoryCaches();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 },
    );
  }
}
