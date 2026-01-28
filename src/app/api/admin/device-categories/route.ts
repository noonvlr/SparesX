import { CategoryBrand, ICategoryBrand } from "@/lib/models/CategoryBrand";
import { connectDB } from "@/lib/db/connect";
import { NextRequest, NextResponse } from "next/server";

// Helper to verify admin role
async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return null;
  }

  try {
    // For now, basic token validation - in production, verify JWT properly
    // This is a simplified check - ideally use a JWT verification library
    return { authenticated: true }; // Simplified for this example
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query: any = {};
    if (category && ["mobile", "laptop", "desktop"].includes(category)) {
      query.category = category;
    }

    const brands = await CategoryBrand.find(query).sort({ name: 1 });

    return NextResponse.json(
      { brands, count: brands.length },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create brand" },
      { status: 500 }
    );
  }
}
