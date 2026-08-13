import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { CategoryBrand, IModel } from "@/lib/models/CategoryBrand";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { slugifyModelName } from "@/lib/utils/modelSuggest";

function normalizeKey(name: string, modelNumber?: string) {
  return `${name}::${modelNumber || ""}`.toLowerCase().trim();
}

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

    const seen = new Set<string>();
    let models: IModel[] = [];
    for (const brand of brands) {
      for (const model of brand.models ?? []) {
        const key = normalizeKey(model.name, model.modelNumber);
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

/** Add a model to the brand catalog (admin only). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) return admin;

    await connectDB();
    const { slug } = await params;
    const body = await req.json();
    const category = String(body.category || "").toLowerCase().trim();
    const name = String(body.name || "").trim();
    const modelNumber = String(body.modelNumber || "").trim();

    if (!category || !name) {
      return NextResponse.json(
        { message: "category and name are required" },
        { status: 400 },
      );
    }

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { message: "Model name must be between 2 and 80 characters" },
        { status: 400 },
      );
    }

    const brand = await CategoryBrand.findOne({
      slug: slug.toLowerCase(),
      category,
      isActive: true,
    });

    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    const exists = (brand.models || []).some(
      (m: IModel) =>
        normalizeKey(m.name, m.modelNumber) === normalizeKey(name, modelNumber),
    );

    if (exists) {
      const existing = (brand.models || []).find(
        (m: IModel) =>
          normalizeKey(m.name, m.modelNumber) ===
          normalizeKey(name, modelNumber),
      );
      return NextResponse.json(
        { message: "Model already exists", model: existing, created: false },
        { status: 200 },
      );
    }

    const model: IModel = {
      name,
      modelNumber: modelNumber || undefined,
      slug: slugifyModelName(name),
      isActive: true,
    };

    brand.models.push(model);
    brand.updatedAt = new Date();
    await brand.save();

    return NextResponse.json(
      { message: "Model created", model, created: true },
      { status: 201 },
    );
  } catch (error) {
    console.error("[brands/models]", error);
    return NextResponse.json(
      { message: "Failed to create model" },
      { status: 500 },
    );
  }
}
