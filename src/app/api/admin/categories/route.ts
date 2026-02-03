import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Category from "@/lib/models/Category";
import { verifyJwt } from "@/lib/auth/jwt";

// GET all categories (admin)
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const categories = await Category.find({
      $or: [{ deviceId: { $exists: false } }, { deviceId: null }],
    }).sort({ order: 1, name: 1 });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST create new category
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, icon, slug, description, isActive, order } = body;

    if (!name || !icon || !slug) {
      return NextResponse.json(
        { error: "Name, icon, and slug are required" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const category = await Category.create({
      name,
      icon,
      slug,
      description,
      isActive: isActive ?? true,
      order: order ?? 0,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
