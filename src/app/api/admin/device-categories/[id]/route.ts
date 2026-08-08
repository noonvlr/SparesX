import { CategoryBrand } from "@/lib/models/CategoryBrand";
import { connectDB } from "@/lib/db/connect";
import DeviceType from "@/lib/models/DeviceType";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) return admin;

    const { id } = await params;

    // Validate MongoDB ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    await connectDB();

    const body = await req.json();
    const { category, name, slug, logo, models, isActive } = body;

    // Validation
    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Validate category exists in DeviceType collection
    const deviceType = await DeviceType.findOne({ slug: category });
    if (!deviceType) {
      return NextResponse.json(
        { error: "Invalid category. Device type not found." },
        { status: 400 }
      );
    }

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check for duplicate slug in same category (excluding current brand)
    const existing = await CategoryBrand.findOne({
      _id: { $ne: id },
      category,
      slug: slug.toLowerCase(),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Brand with this slug already exists in this category" },
        { status: 400 }
      );
    }

    const updatedBrand = await CategoryBrand.findByIdAndUpdate(
      id,
      {
        category,
        name,
        slug: slug.toLowerCase(),
        logo: logo || undefined,
        models: models || [],
        isActive: isActive !== false,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(
      { brand: updatedBrand, message: "Brand updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) return admin;

    const { id } = await params;

    // Validate MongoDB ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    await connectDB();

    const deletedBrand = await CategoryBrand.findByIdAndDelete(id);

    if (!deletedBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Brand deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete brand" },
      { status: 500 }
    );
  }
}
