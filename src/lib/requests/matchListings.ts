import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { productPath } from "@/lib/seo/site";
import { formatListingTitle } from "@/lib/products/listingTitle";

export type RequestMatchInput = {
  category?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  deviceCategory?: string | null;
  /** Optional city hint from requester profile */
  city?: string | null;
  excludeUserId?: string | null;
  limit?: number;
};

export type RequestMatchItem = {
  productId: string;
  slug?: string | null;
  title: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  condition?: string;
  price: number;
  city?: string | null;
  href: string;
  seller: {
    _id: string;
    name: string;
    city?: string | null;
    trustScore?: number;
  };
  score: number;
  reasons: string[];
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find approved listings that roughly match a part request.
 * Scoring: brand + part + model + city proximity (same city bonus).
 */
export async function matchListingsForRequest(
  input: RequestMatchInput,
): Promise<RequestMatchItem[]> {
  await connectDB();
  const limit = Math.min(20, Math.max(1, input.limit || 8));

  const query: Record<string, unknown> = { status: "approved" };
  const and: Record<string, unknown>[] = [];

  if (input.brand?.trim()) {
    and.push({
      brand: {
        $regex: `^${escapeRegex(input.brand.trim())}$`,
        $options: "i",
      },
    });
  }

  if (input.category?.trim()) {
    const cat = escapeRegex(input.category.trim());
    and.push({
      $or: [
        { partType: { $regex: cat, $options: "i" } },
        { category: { $regex: cat, $options: "i" } },
        { name: { $regex: cat, $options: "i" } },
      ],
    });
  }

  if (input.deviceCategory?.trim()) {
    and.push({
      deviceCategory: input.deviceCategory.trim().toLowerCase(),
    });
  }

  if (input.deviceModel?.trim()) {
    const model = escapeRegex(input.deviceModel.trim());
    and.push({
      $or: [
        { deviceModel: { $regex: model, $options: "i" } },
        { name: { $regex: model, $options: "i" } },
        { modelNumber: { $regex: model, $options: "i" } },
      ],
    });
  }

  // Need at least brand or category to avoid dumping the whole catalog
  if (and.length === 0) return [];

  query.$and = and;

  const products = await Product.find(query)
    .select(
      "_id slug name brand deviceModel partType category condition price technician",
    )
    .sort({ updatedAt: -1 })
    .limit(60)
    .lean();

  const sellerIds = [
    ...new Set(
      products
        .map((p) => String(p.technician))
        .filter((id) => id && id !== String(input.excludeUserId || "")),
    ),
  ];

  const sellers = await User.find({
    _id: { $in: sellerIds },
    isBlocked: { $ne: true },
  })
    .select("name city trustScore")
    .lean();

  const sellerMap = new Map(sellers.map((s) => [String(s._id), s]));
  const cityHint = (input.city || "").trim().toLowerCase();

  const scored: RequestMatchItem[] = [];

  for (const p of products) {
    const sellerId = String(p.technician);
    if (input.excludeUserId && sellerId === String(input.excludeUserId)) {
      continue;
    }
    const seller = sellerMap.get(sellerId);
    if (!seller) continue;

    let score = 0;
    const reasons: string[] = [];

    if (input.brand?.trim()) {
      score += 30;
      reasons.push("Brand match");
    }
    if (input.category?.trim()) {
      score += 25;
      reasons.push("Part type match");
    }
    if (
      input.deviceModel?.trim() &&
      String(p.deviceModel || "")
        .toLowerCase()
        .includes(input.deviceModel.trim().toLowerCase())
    ) {
      score += 25;
      reasons.push("Model match");
    }
    if (
      cityHint &&
      String(seller.city || "")
        .toLowerCase()
        .includes(cityHint)
    ) {
      score += 15;
      reasons.push("Same city");
    }
    if (typeof seller.trustScore === "number" && seller.trustScore >= 41) {
      score += 5;
      reasons.push("Trusted seller");
    }

    scored.push({
      productId: String(p._id),
      slug: p.slug || null,
      title: formatListingTitle(p),
      brand: p.brand || undefined,
      deviceModel: p.deviceModel || undefined,
      partType: p.partType || p.category || undefined,
      condition: p.condition || undefined,
      price: typeof p.price === "number" ? p.price : 0,
      city: seller.city || null,
      href: productPath(p),
      seller: {
        _id: sellerId,
        name: seller.name,
        city: seller.city || null,
        trustScore:
          typeof seller.trustScore === "number" ? seller.trustScore : undefined,
      },
      score,
      reasons,
    });
  }

  scored.sort((a, b) => b.score - a.score || a.price - b.price);
  return scored.slice(0, limit);
}
