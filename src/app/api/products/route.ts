import { NextRequest, NextResponse } from "next/server";
import { fetchProductList } from "@/lib/products/listQuery";

// Public: List products with search, filters, pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get("city");

    // Soft profile-city preference when no explicit city filter is set.
    let preferCity: string | undefined;
    if (!cityParam?.trim()) {
      try {
        const { getOptionalUser } = await import("@/lib/auth/getOptionalUser");
        const auth = await getOptionalUser(req);
        if (auth) {
          const { connectDB } = await import("@/lib/db/connect");
          const { User } = await import("@/lib/models/User");
          await connectDB();
          const profile = await User.findById(auth.id).select("city").lean();
          if (profile?.city?.trim()) preferCity = profile.city.trim();
        }
      } catch {
        // Preference is best-effort; listing still works anonymously.
      }
    }

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
      city: cityParam,
      nearby: searchParams.get("nearby"),
      preferCity,
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
        city: cityParam || preferCity || undefined,
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
