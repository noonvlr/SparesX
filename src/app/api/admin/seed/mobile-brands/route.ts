import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { CategoryBrand } from "@/lib/models/CategoryBrand";
import { mobileBrandsSeedData } from "@/lib/seeds/mobile-brands";

export async function POST(req: NextRequest) {
  try {
    // Verify admin token
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if mobile brands already exist
    const existingCount = await CategoryBrand.countDocuments({ category: "mobile" });

    if (existingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Mobile brands already exist (${existingCount} brands found). Use DELETE endpoint to clear first if you want to re-seed.`,
          existingCount,
        },
        { status: 400 }
      );
    }

    // Transform seed data to include category
    const brandsWithCategory = mobileBrandsSeedData.map((brand) => ({
      ...brand,
      category: "mobile" as const,
      isActive: true,
    }));

    // Insert all brands
    const result = await CategoryBrand.insertMany(brandsWithCategory, {
      ordered: false,
    });

    // Calculate total models
    const totalModels = mobileBrandsSeedData.reduce(
      (sum, brand) => sum + brand.models.length,
      0
    );

    return NextResponse.json(
      {
        success: true,
        message: "Mobile brands and models seeded successfully",
        brandsCreated: result.length,
        totalModels,
        brands: result.map((b) => ({
          id: b._id,
          name: b.name,
          modelCount: b.models.length,
        })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate entry - Some brands may already exist",
          details: error.message,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to seed mobile brands",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify admin token
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    await connectDB();

    // Delete all mobile brands
    const result = await CategoryBrand.deleteMany({ category: "mobile" });

    return NextResponse.json(
      {
        success: true,
        message: "Mobile brands deleted successfully",
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete mobile brands",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const count = await CategoryBrand.countDocuments({ category: "mobile" });
    const brands = await CategoryBrand.find({ category: "mobile" })
      .select("name models.length isActive")
      .lean();

    const totalModels = brands.reduce(
      (sum, brand: any) => sum + (brand.models?.length || 0),
      0
    );

    return NextResponse.json(
      {
        success: true,
        message: "Mobile brands status",
        brandsCount: count,
        totalModels,
        isBrandsSeeded: count > 0,
        brands: brands.map((b: any) => ({
          name: b.name,
          modelCount: b.models?.length || 0,
          isActive: b.isActive,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get status",
      },
      { status: 500 }
    );
  }
}
