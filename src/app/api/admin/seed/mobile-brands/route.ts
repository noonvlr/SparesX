import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { CategoryBrand } from "@/lib/models/CategoryBrand";
import { mobileBrandsSeedData } from "@/lib/seeds/mobile-brands";
import { requireAdmin, isAdminError } from "@/lib/auth/requireAdmin";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAdminError(auth)) return auth;

    await connectDB();

    const existingCount = await CategoryBrand.countDocuments({
      category: "mobile",
    });

    if (existingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Mobile brands already exist (${existingCount} brands found). Use DELETE endpoint to clear first if you want to re-seed.`,
          existingCount,
        },
        { status: 400 },
      );
    }

    const brandsWithCategory = mobileBrandsSeedData.map((brand) => ({
      ...brand,
      category: "mobile" as const,
      isActive: true,
    }));

    const result = await CategoryBrand.insertMany(brandsWithCategory, {
      ordered: false,
    });

    const totalModels = mobileBrandsSeedData.reduce(
      (sum, brand) => sum + brand.models.length,
      0,
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
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    if (err.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate entry - Some brands may already exist",
          details: err.message,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to seed mobile brands",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAdminError(auth)) return auth;

    await connectDB();

    const result = await CategoryBrand.deleteMany({ category: "mobile" });

    return NextResponse.json(
      {
        success: true,
        message: "Mobile brands deleted successfully",
        deletedCount: result.deletedCount,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to delete mobile brands",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAdminError(auth)) return auth;

    await connectDB();

    const count = await CategoryBrand.countDocuments({ category: "mobile" });
    const brands = await CategoryBrand.find({ category: "mobile" })
      .select("name models.length isActive")
      .lean();

    const totalModels = brands.reduce(
      (sum, brand: { models?: unknown[] }) =>
        sum + (brand.models?.length || 0),
      0,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Mobile brands status",
        brandsCount: count,
        totalModels,
        isBrandsSeeded: count > 0,
        brands: brands.map((b: { name: string; models?: unknown[]; isActive?: boolean }) => ({
          name: b.name,
          modelCount: b.models?.length || 0,
          isActive: b.isActive,
        })),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to get status",
      },
      { status: 500 },
    );
  }
}
