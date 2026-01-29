import { CategoryBrand } from "@/lib/models/CategoryBrand";
import { connectDB } from "@/lib/db/connect";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

// Helper to verify admin role
async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return null;
  }

  try {
    // For now, basic token validation - in production, verify JWT properly
    return { authenticated: true }; // Simplified for this example
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate MongoDB ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    await connectDB();

    const body = await req.json();
    const { category, name, slug, logo, models, isActive } = body;

    // Validation
    if (!category || !["mobile", "laptop", "desktop"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
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
    // Verify admin
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
