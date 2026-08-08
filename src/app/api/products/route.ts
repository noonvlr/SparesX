import { NextRequest, NextResponse } from "next/server";
import { fetchProductList } from "@/lib/products/listQuery";

// Public: List products with search, filters, pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const result = await fetchProductList({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      deviceCategory: searchParams.get("deviceCategory"),
      category: searchParams.get("category"),
      brand: searchParams.get("brand"),
      deviceModel: searchParams.get("deviceModel"),
      model: searchParams.get("model"),
      partType: searchParams.get("partType"),
      condition: searchParams.get("condition"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      search: searchParams.get("search"),
      city: searchParams.get("city"),
      sellerType: searchParams.get("sellerType"),
      sort: searchParams.get("sort"),
      negotiable: searchParams.get("negotiable"),
    });

    const searchQ = searchParams.get("search")?.trim();
    if (searchQ && searchQ.length >= 2) {
      const { trackMarketplaceEvent } = await import("@/lib/analytics/events");
      void trackMarketplaceEvent({
        type: "search",
        query: searchQ,
        brand: searchParams.get("brand") || undefined,
        partType: searchParams.get("partType") || undefined,
        deviceModel:
          searchParams.get("deviceModel") ||
          searchParams.get("model") ||
          undefined,
        city: searchParams.get("city") || undefined,
        meta: { resultCount: result.total },
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch {
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
