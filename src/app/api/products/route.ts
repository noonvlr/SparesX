import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Public: List products with search, filters, pagination
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const deviceCategory = searchParams.get("deviceCategory");
    const brand = searchParams.get("brand");
    const deviceModel =
      searchParams.get("deviceModel") || searchParams.get("model");
    const partType = searchParams.get("partType");
    const condition = searchParams.get("condition");
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "0");
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const query: Record<string, unknown> = { status: "approved" };
    const andClauses: Record<string, unknown>[] = [];

    if (deviceCategory) {
      query.deviceCategory = deviceCategory.toLowerCase();
    } else if (category) {
      // Legacy ?category= maps to deviceCategory or old category field
      andClauses.push({
        $or: [
          { deviceCategory: category.toLowerCase() },
          { category },
        ],
      });
    }

    if (brand) {
      query.brand = {
        $regex: `^${escapeRegex(brand)}$`,
        $options: "i",
      };
    }

    if (deviceModel) {
      query.deviceModel = {
        $regex: escapeRegex(deviceModel),
        $options: "i",
      };
    }

    if (partType) query.partType = partType;
    if (condition) query.condition = condition;

    if (minPrice || maxPrice) {
      const priceQuery: { $gte?: number; $lte?: number } = {};
      if (minPrice) priceQuery.$gte = minPrice;
      if (maxPrice) priceQuery.$lte = maxPrice;
      query.price = priceQuery;
    }

    if (search) {
      andClauses.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
          { deviceModel: { $regex: search, $options: "i" } },
          { partType: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (andClauses.length > 0) {
      query.$and = andClauses;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { products, total, page, pages: Math.ceil(total / limit) },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        products: [],
        total: 0,
        page: 1,
        pages: 0,
        error: "Failed to fetch products",
      },
      { status: 500 },
    );
  }
}
