import { CategoryBrand } from "@/lib/models/CategoryBrand";
import { connectDB } from "@/lib/db/connect";
import DeviceType from "@/lib/models/DeviceType";
import { NextRequest, NextResponse } from "next/server";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query: any = {};
    if (category) {
      const deviceType = await DeviceType.findOne({ slug: category });
      if (deviceType) {
        query.category = category;
      }
    }

    const brands = await CategoryBrand.find(query).sort({ name: 1 });

    return NextResponse.json(
      { brands, count: brands.length },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) return admin;

    await connectDB();

    const body = await req.json();
    const { category, name, slug, logo, models, isActive } = body;

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

    // Check for duplicate slug in same category
    const existing = await CategoryBrand.findOne({
      category,
      slug: slug.toLowerCase(),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Brand with this slug already exists in this category" },
        { status: 400 }
      );
    }

    const newBrand = new CategoryBrand({
      category,
      name,
      slug: slug.toLowerCase(),
      logo: logo || undefined,
      models: models || [],
      isActive: isActive !== false,
    });

    await newBrand.save();

    return NextResponse.json(
      { brand: newBrand, message: "Brand created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create brand" },
      { status: 500 }
    );
  }
}
