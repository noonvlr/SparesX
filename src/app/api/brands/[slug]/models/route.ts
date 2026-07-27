import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { CategoryBrand, IModel } from "@/lib/models/CategoryBrand";

// Get models for a specific brand (from CategoryBrand collection)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const category = searchParams.get("category")?.toLowerCase();

    await connectDB();

    const query: { slug: string; isActive: boolean; category?: string } = {
      slug: slug.toLowerCase(),
      isActive: true,
    };
    if (category) query.category = category;

    const brands = await CategoryBrand.find(query)
      .select("name slug category models")
      .lean();

    if (!brands.length) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    // Merge models across matching category docs (same brand slug)
    const seen = new Set<string>();
    let models: IModel[] = [];
    for (const brand of brands) {
      for (const model of brand.models ?? []) {
        const key = `${model.name}::${model.modelNumber || ""}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        models.push(model);
      }
    }

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

    models.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(
      {
        brand: brands[0].name,
        slug: brands[0].slug,
        category: category || brands[0].category,
        models,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch models" },
      { status: 500 },
    );
  }
}
