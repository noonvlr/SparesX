import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { CategoryBrand } from "@/lib/models/CategoryBrand";

// Get models for a specific brand (from CategoryBrand collection)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const category = (searchParams.get("category") || "mobile").toLowerCase();

    await connectDB();

    const brand = await CategoryBrand.findOne({
      slug: slug.toLowerCase(),
      category,
      isActive: true,
    }).lean();

    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    let models = brand.models ?? [];

    if (search) {
      const searchLower = search.toLowerCase();
      models = models.filter((model) => {
        const nameMatch = model.name?.toLowerCase().includes(searchLower);
        const numberMatch = model.modelNumber
          ?.toLowerCase()
          .includes(searchLower);
        return nameMatch || numberMatch;
      });
    }

    return NextResponse.json(
      {
        brand: brand.name,
        slug: brand.slug,
        category: brand.category,
        models,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
